import os
import asyncio
import logging
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from webhooks import om_handler, github_handler
from database.db import init_db, get_events, get_incidents, get_stats, resolve_incident
from websocket_manager import manager

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Meridian API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Webhooks ──────────────────────────────────────────────────────────────────
app.include_router(om_handler.router,     prefix="/webhooks", tags=["Webhooks"])
app.include_router(github_handler.router, prefix="/webhooks", tags=["Webhooks"])


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── Core REST API ─────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/api/events")
async def api_get_events(limit: int = 50, offset: int = 0):
    events = await get_events(limit=limit, offset=offset)
    return {"events": events, "total": len(events)}


@app.get("/api/incidents")
async def api_get_incidents(status: Optional[str] = None):
    incidents = await get_incidents(status=status)
    return {"incidents": incidents}


@app.patch("/api/incidents/{incident_id}/resolve")
async def api_resolve_incident(incident_id: str):
    success = await resolve_incident(incident_id)
    if not success:
        raise HTTPException(status_code=404, detail="Incident not found or already resolved")
    return {"status": "resolved", "id": incident_id}


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
    return {
        "overall_status": signals.get("overall_status"),
        "panels": panels,
        "signals": signals,
    }


# ── Startup ───────────────────────────────────────────────────────────────────
async def start_slack_socket_mode():
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    app_token = os.environ.get("SLACK_APP_TOKEN")

    if not (bot_token and app_token):
        logging.warning("Slack tokens missing — integration disabled.")
        return

    from slack_bolt.async_app import AsyncApp
    from slack_bolt.adapter.socket_mode.aiohttp import AsyncSocketModeHandler
    from slack_bot import commands

    slack_app = AsyncApp(token=bot_token)
    commands.register_commands(slack_app)
    handler = AsyncSocketModeHandler(slack_app, app_token)
    logging.info("Starting Slack Socket Mode…")
    await handler.start_async()


@app.on_event("startup")
async def startup_event():
    await init_db()
    logging.info("Database initialised.")
    asyncio.create_task(start_slack_socket_mode())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
