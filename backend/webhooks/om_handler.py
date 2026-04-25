import os
import logging
from fastapi import APIRouter, Request
from slack_bolt.async_app import AsyncApp
from websocket_manager import manager
import datetime

router = APIRouter()

@router.post("/openmetadata")
async def handle_om_webhook(request: Request):
    payload = await request.json()
    event_type = payload.get("eventType")
    entity_type = payload.get("entityType")
    entity = payload.get("entity", {})
    
    logging.info(f"OM Webhook Received: {event_type} on {entity_type}")
    
    if event_type == "entityUpdated":
        # Check if PII tags were added
        tags = entity.get("tags", [])
        fqn = entity.get("fullyQualifiedName", "Unknown")
        
        has_pii = any("PII" in tag.get("tagFQN", "") for tag in tags)
        if has_pii:
            bot_token = os.environ.get("SLACK_BOT_TOKEN")
            channel = os.environ.get("SLACK_CHANNEL_ID", "#general")
            
            if bot_token:
                app = AsyncApp(token=bot_token)
                try:
                    await app.client.chat_postMessage(
                        channel=channel,
                        text=f"🛡️ *Governance Alert*\n\nPII Sensitive tags were detected on `{fqn}`. Please ensure data masking policies are enforced."
                    )
                except Exception as e:
                    logging.error(f"Failed to send Slack alert: {e}")
                    
    # Push event to WebSocket for frontend ticker
    ws_payload = {
        "id": str(os.urandom(8).hex()),
        "type": event_type,
        "message": f"{entity_type.capitalize()} '{entity.get('name', 'Unknown')}' was {event_type.replace('entity', '').lower()}.",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    if has_pii:
        ws_payload["type"] = "pii_detected"
        ws_payload["message"] = f"Potential PII detected in '{fqn}'."
        
    await manager.broadcast(ws_payload)
    
    return {"status": "ok"}
