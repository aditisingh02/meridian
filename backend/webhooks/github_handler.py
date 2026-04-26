import os
import json
import logging
from fastapi import APIRouter, Request
from slack_bolt.async_app import AsyncApp
from websocket_manager import manager
from database.db import save_event, save_incident

router = APIRouter()

SCHEMA_BREAKING_KEYWORDS = ["drop", "delete", "remove", "rename", "alter", "truncate"]

@router.post("/github")
async def handle_github_webhook(request: Request):
    payload = await request.json()
    action = payload.get("action")
    pr = payload.get("pull_request", {})
    title = pr.get("title", "")
    pr_number = pr.get("number", "?")
    user = pr.get("user", {}).get("login", "unknown")

    logging.info(f"GitHub PR Action: {action} - {title}")

    if action not in ["opened", "reopened", "synchronize"]:
        return {"status": "ignored"}

    title_lower = title.lower()
    is_breaking = any(kw in title_lower for kw in SCHEMA_BREAKING_KEYWORDS)

    if not is_breaking:
        return {"status": "ok", "flagged": False}

    message = f"GitHub PR #{pr_number} by {user}: {title}"

    # Persist event
    event = await save_event(
        event_type="schema_change",
        message=message,
        source="github",
        table_fqn=None,
        raw_payload=json.dumps(payload),
    )

    # Auto-create incident
    await save_incident(
        severity="warning",
        title=f"Schema-breaking PR #{pr_number}: {title[:80]}",
        table_fqn=None,
        owner=user,
    )

    # Broadcast to WebSocket
    await manager.broadcast(event)

    # Slack alert
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    channel = os.environ.get("SLACK_CHANNEL_ID")
    if bot_token and channel:
        app = AsyncApp(token=bot_token)
        try:
            await app.client.chat_postMessage(
                channel=channel,
                text=(
                    f"🚨 *Schema Impact Alert*\n\n"
                    f"`{user}` opened PR #{pr_number} that may break downstream systems:\n"
                    f"> *{title}*\n\n"
                    f"_Run `/meridian impact <table_fqn>` to check blast radius._"
                ),
                unfurl_links=False,
            )
        except Exception as e:
            logging.error(f"Failed to send Slack alert: {e}")

    return {"status": "ok", "flagged": True}
