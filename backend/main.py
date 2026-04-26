import os
import asyncio
import logging
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from webhooks import om_handler, github_handler, sentry_handler
from database.db import init_db, get_events, get_incidents, get_stats, resolve_incident
from websocket_manager import manager
from openmetadata_client import OpenMetadataClient

om_client = OpenMetadataClient()

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Meridian API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Webhooks ──────────────────────────────────────────────────────────────────
app.include_router(om_handler.router,      prefix="/webhooks", tags=["Webhooks"])
app.include_router(github_handler.router,  prefix="/webhooks", tags=["Webhooks"])
app.include_router(sentry_handler.router,  prefix="/webhooks", tags=["Webhooks"])


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status":  "healthy",
        "version": "2.1.0",
        "integrations": {
            "openmetadata": bool(os.getenv("OM_JWT_TOKEN")),
            "slack":        bool(os.getenv("SLACK_BOT_TOKEN")),
            "github":       bool(os.getenv("GITHUB_TOKEN")),
            "jira":         bool(os.getenv("JIRA_API_TOKEN")),
            "groq":         bool(os.getenv("GROQ_API_KEY")),
            "pagerduty":    bool(os.getenv("PAGERDUTY_ROUTING_KEY")),
            "dbt_cloud":    bool(os.getenv("DBT_CLOUD_TOKEN")),
            "sentry":       bool(os.getenv("SENTRY_AUTH_TOKEN")),
        },
    }


# ── Core REST API ─────────────────────────────────────────────────────────────
@app.get("/api/events")
async def api_get_events(limit: int = 50, offset: int = 0):
    events = await get_events(limit=limit, offset=offset)
    return {"events": events, "total": len(events)}


@app.get("/api/incidents")
async def api_get_incidents(status: Optional[str] = None):
    return {"incidents": await get_incidents(status=status)}


@app.patch("/api/incidents/{incident_id}/resolve")
async def api_resolve_incident(incident_id: str):
    status = await resolve_incident(incident_id)
    return {"status": "success", "pagerduty": status}

# ── Data Proxy (OpenMetadata) ─────────────────────────────────────────────────
@app.get("/api/data/search")
async def search_data(q: str):
    return await om_client.search_entities(q)

@app.get("/api/data/table")
async def get_table(fqn: str):
    data = await om_client.get_table_by_fqn(fqn)
    if not data:
        raise HTTPException(status_code=404, detail="Table not found")
    return data

@app.get("/api/data/lineage")
async def get_lineage(fqn: str):
    data = await om_client.get_lineage_by_name("table", fqn)
    if not data:
        raise HTTPException(status_code=404, detail="Lineage not found")
    return data

@app.get("/api/data/quality")
async def get_quality(fqn: str):
    data = await om_client.get_test_cases_by_table(fqn)
    if not data:
        raise HTTPException(status_code=404, detail="Quality tests not found")
    return data


@app.get("/api/stats")
async def api_get_stats():
    return await get_stats()


# ── Intelligence API ──────────────────────────────────────────────────────────
@app.get("/api/intelligence/github")
async def api_github_intelligence(days: int = 30):
    from intelligence import github_agent
    return await github_agent.analyse(days=days)


@app.get("/api/intelligence/hr")
async def api_hr_intelligence(days: int = 30):
    from intelligence import hr_intelligence
    return await hr_intelligence.analyse(days=days)


@app.get("/api/intelligence/finance")
async def api_finance_intelligence(days: int = 30):
    from intelligence import finance_intelligence
    return await finance_intelligence.analyse(days=days)


@app.get("/api/intelligence/pm")
async def api_pm_intelligence(days: int = 14):
    from intelligence import pm_intelligence
    return await pm_intelligence.analyse(days=days)


@app.get("/api/intelligence/dbt")
async def api_dbt_intelligence():
    from integrations.dbt_client import analyse
    return await analyse()


@app.get("/api/intelligence/sentry")
async def api_sentry_intelligence():
    from integrations.sentry_client import analyse
    return await analyse()

@app.get("/api/intelligence/{domain}/insight")
async def api_intelligence_insight(domain: str):
    import json
    from ai.llm import LLMClient
    
    # Get the raw data
    data = {}
    if domain == "github":
        from intelligence import github_agent
        data = await github_agent.analyse()
    elif domain == "hr":
        from intelligence import hr_intelligence
        data = await hr_intelligence.analyse()
    elif domain == "finance":
        from intelligence import finance_intelligence
        data = await finance_intelligence.analyse()
    elif domain == "pm":
        from intelligence import pm_intelligence
        data = await pm_intelligence.analyse()
    elif domain == "dbt":
        from integrations.dbt_client import analyse
        data = await analyse()
    elif domain == "sentry":
        from integrations.sentry_client import analyse
        data = await analyse()
    else:
        raise HTTPException(status_code=400, detail="Invalid domain")
        
    client = LLMClient()
    
    if not client.client:
        return {"insight": "Groq API key not configured. Cannot generate insights."}
        
    system_prompt = (
        "You are an expert Engineering Manager & Data Governance AI. "
        "Analyze the provided JSON metrics for a specific domain and write a concise, "
        "insightful 2-3 sentence summary in plain text. Highlight key risks or positive trends. "
        "Do not use markdown formatting like asterisks or bullet points. "
        "Do not hallucinate or use external data."
    )
    
    try:
        response = await client.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Domain: {domain}\nMetrics:\n{json.dumps(data, indent=2)}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
        )
        return {"insight": response.choices[0].message.content}
    except Exception as e:
        return {"insight": f"Failed to generate insight: {str(e)}"}


# ── Executive API ─────────────────────────────────────────────────────────────
@app.get("/api/executive/signals")
async def api_executive_signals(days: int = 14):
    from intelligence import executive_intelligence
    return await executive_intelligence.get_signals(days=days)


@app.get("/api/executive/brief")
async def api_executive_brief(days: int = 14):
    from intelligence import executive_intelligence
    return await executive_intelligence.get_brief(days=days)


@app.get("/api/executive/dashboard")
async def api_executive_dashboard(days: int = 14):
    from intelligence import executive_intelligence
    signals = await executive_intelligence.get_signals(days=days)
    panels  = executive_intelligence._nine_panel_dashboard(signals)
    return {"overall_status": signals.get("overall_status"), "panels": panels, "signals": signals}


# ── PagerDuty API ─────────────────────────────────────────────────────────────
@app.post("/api/pagerduty/trigger")
async def api_pd_trigger(body: dict):
    """Manually trigger a PagerDuty alert (for testing)."""
    from integrations.pagerduty_client import trigger_incident
    result = await trigger_incident(
        summary   = body.get("summary", "Meridian manual alert"),
        severity  = body.get("severity", "warning"),
        source    = "Meridian-Manual",
        dedup_key = body.get("dedup_key"),
        details   = body.get("details"),
    )
    return result


@app.post("/api/pagerduty/resolve/{dedup_key}")
async def api_pd_resolve(dedup_key: str):
    from integrations.pagerduty_client import resolve_incident as pd_resolve
    return await pd_resolve(dedup_key=dedup_key)


@app.get("/api/pagerduty/status")
async def api_pd_status():
    return {"configured": bool(os.getenv("PAGERDUTY_ROUTING_KEY"))}


# ── Agent API ─────────────────────────────────────────────────────────────────
@app.post("/api/agent/run")
async def api_agent_run(body: dict):
    """
    Run the Meridian ReAct agent with a natural language goal.
    Body: { "goal": "...", "dry_run": true }
    """
    from ai.agent import AgentRunner
    goal    = body.get("goal", "").strip()
    dry_run = body.get("dry_run", True)   # default to safe dry-run mode

    if not goal:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="'goal' is required")

    runner = AgentRunner(dry_run=dry_run)
    return await runner.run(goal)


@app.get("/api/agent/history")
async def api_agent_history(limit: int = 10):
    """Return recent agent run history."""
    from ai import agent_memory
    return {"runs": agent_memory.get_history(limit=limit)}


@app.post("/api/agent/auto-triage")
async def api_agent_auto_triage(body: dict):
    """
    Auto-Trigger the Agent on a critical incident from webhooks.
    """
    from ai.agent import AgentRunner
    
    incident_details = body.get("incident", {})
    goal = f"Investigate this incident: {incident_details}. Determine if PagerDuty needs to be triggered or Jira ticket created."
    dry_run = body.get("dry_run", True)
    
    runner = AgentRunner(dry_run=dry_run)
    return await runner.run(goal)




# ── Startup ───────────────────────────────────────────────────────────────────
async def start_slack_socket_mode():
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    app_token = os.environ.get("SLACK_APP_TOKEN")
    if not (bot_token and app_token):
        logging.warning("Slack tokens missing — integration disabled.")
        return
    try:
        from slack_bolt.async_app import AsyncApp
        from slack_bolt.adapter.socket_mode.aiohttp import AsyncSocketModeHandler
        from slack_bot import commands
        slack_app = AsyncApp(token=bot_token)
        commands.register_commands(slack_app)
        handler = AsyncSocketModeHandler(slack_app, app_token)
        logging.info("Starting Slack Socket Mode…")
        await handler.start_async()
    except Exception as exc:
        logging.exception("Slack Socket Mode startup failed: %s", exc)


@app.on_event("startup")
async def startup_event():
    await init_db()
    logging.info("Database initialised.")
    asyncio.create_task(start_slack_socket_mode())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
