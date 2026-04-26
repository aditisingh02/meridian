"""
Sentry webhook receiver — processes Sentry issue.created alerts,
correlates with data quality, and creates Meridian incidents.
"""
import json
import logging
import os
from fastapi import APIRouter, Request, Header, HTTPException
import hmac
import hashlib
from database.db import save_event, save_incident
from websocket_manager import manager

router = APIRouter()

SENTRY_CLIENT_SECRET = os.getenv("SENTRY_WEBHOOK_SECRET", "")

# Keywords suggesting data pipeline involvement
DATA_KEYWORDS = [
    "database", "db", "query", "sql", "table", "schema", "null", "column",
    "pipeline", "dbt", "bigquery", "snowflake", "postgres", "mysql",
    "connection", "timeout", "stale", "freshness", "integrity",
]


def _is_data_related(title: str, culprit: str = "") -> bool:
    text = f"{title} {culprit}".lower()
    return any(kw in text for kw in DATA_KEYWORDS)


@router.post("/sentry")
async def handle_sentry_webhook(
    request: Request,
    sentry_hook_resource: str = Header(default=""),
):
    """
    Receives Sentry webhook events.
    Register this URL in: Sentry → Project → Settings → Integrations → WebHooks
    Events: issue.created, issue.resolved
    """
    payload = await request.json()
    action  = payload.get("action", "")
    issue   = payload.get("data", {}).get("issue", {})

    title   = issue.get("title", "Unknown error")
    level   = issue.get("level", "error")
    culprit = issue.get("culprit", "")
    count   = issue.get("count", 1)

    logging.info(f"Sentry webhook: action={action} level={level} title={title[:60]}")

    if action == "created":
        is_data = _is_data_related(title, culprit)
        ev_type = "data_error" if is_data else "app_error"
        message = f"[Sentry] {level.upper()}: {title}"
        if is_data:
            message += " (data pipeline suspected)"

        event = await save_event(
            event_type  = ev_type,
            message     = message,
            source      = "sentry",
            table_fqn   = None,
            raw_payload = json.dumps(payload),
        )
        await manager.broadcast(event)

        # Auto-incident for fatal data errors
        if level == "fatal" or (is_data and level == "error"):
            severity = "critical" if level == "fatal" else "warning"
            await save_incident(
                severity  = severity,
                title     = f"Sentry: {title[:100]}",
                table_fqn = None,
                owner     = "engineering",
            )

    elif action == "resolved":
        event = await save_event(
            event_type = "app_resolved",
            message    = f"[Sentry] Resolved: {title}",
            source     = "sentry",
        )
        await manager.broadcast(event)

    return {"status": "ok"}
