import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

from webhooks import om_handler, github_handler

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Meridian API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Webhooks
app.include_router(om_handler.router, prefix="/webhooks", tags=["OpenMetadata Webhooks"])
app.include_router(github_handler.router, prefix="/webhooks", tags=["GitHub Webhooks"])

from websocket_manager import manager

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)



@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Slack Socket Mode background task setup
async def start_slack_socket_mode():
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    app_token = os.environ.get("SLACK_APP_TOKEN")
    
    if bot_token and app_token:
        from slack_bolt.async_app import AsyncApp
        from slack_bolt.adapter.socket_mode.aiohttp import AsyncSocketModeHandler
        from slack_bot import commands
        
        slack_app = AsyncApp(token=bot_token)
        commands.register_commands(slack_app)
        
        handler = AsyncSocketModeHandler(slack_app, app_token)
        logging.info("Starting Slack Socket Mode...")
        await handler.start_async()
    else:
        logging.warning("SLACK_BOT_TOKEN or SLACK_APP_TOKEN not found. Slack integration disabled.")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_slack_socket_mode())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

