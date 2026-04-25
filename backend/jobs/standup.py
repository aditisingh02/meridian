import os
import asyncio
import logging
from slack_bolt.async_app import AsyncApp
from backend.openmetadata_client import OpenMetadataClient

async def run_data_standup():
    """
    Simulates a Data Standup job that runs daily (or manually triggered)
    to summarize recent data quality test failures.
    """
    logging.info("Starting Data Standup Job...")
    
    om_client = OpenMetadataClient()
    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    channel = os.environ.get("SLACK_CHANNEL_ID", "#general")
    
    if not bot_token:
        logging.error("No SLACK_BOT_TOKEN found. Skipping standup.")
        return
        
    app = AsyncApp(token=bot_token)
    
    # In a real scenario, we would use OM client to fetch all test case failures in the last 24h
    # For the hackathon demo, we will mock the response or search a known entity.
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🌅 Morning Data Standup",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Data Quality Alert:* `3` test failures detected in the past 24 hours. Please review the affected assets."
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "1. `sample_data.ecommerce_db.shopify.orders` (Row Count Check Failed)\n2. `sample_data.ecommerce_db.shopify.dim_address` (Null Value Check Failed)\n3. `sample_data.ecommerce_db.shopify.fact_sale` (Freshness SLA Missed)"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "Use `/meridian impact [table_fqn]` to see downstream blast radius."
                }
            ]
        }
    ]
    
    try:
        await app.client.chat_postMessage(channel=channel, blocks=blocks)
        logging.info("Data Standup Slack message sent!")
    except Exception as e:
        logging.error(f"Failed to send Data Standup message: {e}")

if __name__ == "__main__":
    asyncio.run(run_data_standup())
