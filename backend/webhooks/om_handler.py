import os
import json
import logging
from fastapi import APIRouter, Request
from slack_bolt.async_app import AsyncApp
from websocket_manager import manager
from database.db import save_event, save_incident
import datetime

router = APIRouter()

@router.post("/openmetadata")
async def handle_om_webhook(request: Request):
    payload = await request.json()
    event_type = payload.get("eventType", "entityUpdated")
    entity_type = payload.get("entityType", "table")
    entity = payload.get("entity", {})
    fqn = entity.get("fullyQualifiedName", entity.get("name", "Unknown"))
    tags = entity.get("tags", [])

    logging.info(f"OM Webhook Received: {event_type} on {entity_type}")

    has_pii = any("PII" in tag.get("tagFQN", "") for tag in tags)

    # Determine event type + message
    if has_pii:
        ev_type = "pii_detected"
        message = f"Potential PII detected in '{fqn}'."
        severity = "warning"
        incident_title = f"PII tag detected on {fqn}"
    else:
        ev_type = "entity_updated"
        message = f"{entity_type.capitalize()} '{fqn}' was updated."
        severity = None
        incident_title = None

    # Persist event
    event = await save_event(
        event_type=ev_type,
        message=message,
        source="openmetadata",
        table_fqn=fqn,
        raw_payload=json.dumps(payload),
    )

    # Auto-create incident for PII
    if has_pii and severity:
        await save_incident(
            severity=severity,
            title=incident_title,
            table_fqn=fqn,
            owner="data-governance",
        )

    # Broadcast to WebSocket clients
    await manager.broadcast(event)

    # Slack alert
    if has_pii:
        bot_token = os.environ.get("SLACK_BOT_TOKEN")
        channel = os.environ.get("SLACK_CHANNEL_ID")
        if bot_token and channel:
            app = AsyncApp(token=bot_token)
            try:
                await app.client.chat_postMessage(
                    channel=channel,
                    text=f"🛡️ *Governance Alert*\n\nPII tags detected on `{fqn}`. Ensure masking policies are enforced.",
                )
            except Exception as e:
                logging.error(f"Failed to send Slack alert: {e}")

    return {"status": "ok"}
