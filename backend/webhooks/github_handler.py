import os
import logging
from fastapi import APIRouter, Request
from slack_bolt.async_app import AsyncApp
from openmetadata_client import OpenMetadataClient
from websocket_manager import manager
import datetime

router = APIRouter()
om_client = OpenMetadataClient()

@router.post("/github")
async def handle_github_webhook(request: Request):
    payload = await request.json()
    action = payload.get("action")
    pr = payload.get("pull_request", {})
    title = pr.get("title", "")
    pr_url = pr.get("html_url", "")
    user = pr.get("user", {}).get("login", "Unknown")
    
    logging.info(f"GitHub PR Action: {action} - {title}")
    
    if action in ["opened", "reopened", "synchronize"]:
        # Naive keyword matching for hackathon demo
        if "drop" in title.lower() or "delete" in title.lower() or "remove" in title.lower():
            # Use Slack App to send message
            bot_token = os.environ.get("SLACK_BOT_TOKEN")
            channel = os.environ.get("SLACK_CHANNEL_ID", "#general")
            
            if bot_token:
                app = AsyncApp(token=bot_token)
                try:
                    await app.client.chat_postMessage(
                        channel=channel,
                        text=f"🚨 *Data Contract Alert* 🚨\n\nUser `{user}` opened a PR that might break downstream systems:\n> *{title}*\n\n_We recommend checking `/meridian impact` before merging._",
                        unfurl_links=False
                    )
                except Exception as e:
                    logging.error(f"Failed to send Slack alert: {e}")
                    
            ws_payload = {
                "id": str(os.urandom(8).hex()),
                "type": "schema_change",
                "message": f"GitHub PR #{pr.get('number')} by {user}: {title}",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            await manager.broadcast(ws_payload)
            
    return {"status": "ok"}
