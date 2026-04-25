def get_standup_blocks(healthy: int, at_risk: int, failed: int):
    return [
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
                "text": f"*System Health Summary*\n🟢 Healthy: {healthy}\n🟡 At Risk: {at_risk}\n🔴 Failed: {failed}"
            }
        }
    ]

def get_impact_blocks(table_name: str, downstream_count: int):
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"💥 *Blast Radius for `{table_name}`*\nFound *{downstream_count}* downstream assets affected."
            }
        }
    ]

def get_pii_alert_blocks(column_name: str, table_name: str):
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"🚨 *Potential PII Detected*\nThe column `{column_name}` in `{table_name}` looks like PII but has no classification tag. Want me to tag it?"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Yes, Tag as PII"
                    },
                    "style": "primary",
                    "value": f"tag_pii_{table_name}_{column_name}"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "No, Ignore"
                    },
                    "value": "ignore_pii"
                }
            ]
        }
    ]
