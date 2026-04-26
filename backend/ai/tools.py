"""
Tool Registry — All LLM-callable tools for the Meridian ReAct Agent.
Each tool has:
  - A JSON schema (for Groq function calling)
  - An async executor function
"""
from typing import Any
import json


# ── Tool Schemas (for Groq function calling API) ───────────────────────────────

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_sprint_health",
            "description": "Get the current Jira sprint health: completion %, blocked issues, scope creep, delivery confidence.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_github_activity",
            "description": "Get GitHub PR metrics, commit patterns, cycle times, and top contributors for the last N days.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Number of days to look back (default 14)"}
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_sentry_errors",
            "description": "Get recent Sentry error counts, critical issues, and data-pipeline correlation.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_dbt_pipeline_health",
            "description": "Get dbt Cloud pipeline run results, success rates, test failures.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_om_data_quality",
            "description": "Get OpenMetadata data quality test results for a specific table. Use this to check if a table's DQ tests are passing.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_fqn": {"type": "string", "description": "Fully qualified table name (e.g. 'default.orders')"}
                },
                "required": ["table_fqn"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_om_table_lineage",
            "description": "Get OpenMetadata lineage for a table — what it depends on and what depends on it (downstream blast radius).",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_fqn": {"type": "string", "description": "Fully qualified table name"}
                },
                "required": ["table_fqn"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_open_incidents",
            "description": "Get the current list of open Meridian incidents (from the internal DB).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "trigger_pagerduty_alert",
            "description": "Trigger a PagerDuty incident to page the on-call team. Only use this for genuinely critical issues that require immediate human intervention.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary":   {"type": "string", "description": "One-line description of the incident"},
                    "severity":  {"type": "string", "enum": ["critical", "error", "warning", "info"], "description": "Incident severity"},
                    "details":   {"type": "string", "description": "Additional context about the issue"},
                },
                "required": ["summary", "severity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_jira_ticket",
            "description": "Create a new Jira issue in the active project for tracking a problem or follow-up action.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary":     {"type": "string", "description": "Issue title"},
                    "description": {"type": "string", "description": "Detailed description of the issue"},
                    "priority":    {"type": "string", "enum": ["Highest", "High", "Medium", "Low", "Lowest"], "description": "Issue priority"},
                },
                "required": ["summary", "priority"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "post_slack_message",
            "description": "Post a message to the configured Slack channel to notify the team of a finding or action taken.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "The message to post"}
                },
                "required": ["message"],
            },
        },
    },
]


# ── Tool Executors ─────────────────────────────────────────────────────────────

async def execute_tool(tool_name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Route a tool call name + args to the actual async function."""

    if tool_name == "get_sprint_health":
        from intelligence.pm_intelligence import analyse
        return await analyse(days=14)

    elif tool_name == "get_github_activity":
        from intelligence.github_agent import analyse
        days = args.get("days", 14)
        return await analyse(days=days)

    elif tool_name == "get_sentry_errors":
        from integrations.sentry_client import analyse
        return await analyse()

    elif tool_name == "get_dbt_pipeline_health":
        from integrations.dbt_client import analyse
        return await analyse()

    elif tool_name == "get_om_data_quality":
        from openmetadata_client import OpenMetadataClient
        om = OpenMetadataClient()
        fqn = args.get("table_fqn", "")
        result = await om.get_test_cases_by_table(fqn)
        return result or {"error": f"No quality data found for {fqn}"}

    elif tool_name == "get_om_table_lineage":
        from openmetadata_client import OpenMetadataClient
        om = OpenMetadataClient()
        fqn = args.get("table_fqn", "")
        result = await om.get_lineage_by_name("table", fqn)
        return result or {"error": f"No lineage found for {fqn}"}

    elif tool_name == "get_open_incidents":
        from database.db import get_incidents
        incidents = await get_incidents(status="open")
        return {"incidents": incidents}

    elif tool_name == "trigger_pagerduty_alert":
        from integrations.pagerduty_client import trigger_incident
        return await trigger_incident(
            summary=args["summary"],
            severity=args.get("severity", "warning"),
            source="Meridian-Agent",
            details={"agent_context": args.get("details", "")},
        )

    elif tool_name == "create_jira_ticket":
        from integrations.jira_client import create_issue
        return await create_issue(
            summary=args["summary"],
            description=args.get("description", ""),
            priority=args.get("priority", "Medium"),
        )

    elif tool_name == "post_slack_message":
        import os
        from slack_sdk.web.async_client import AsyncWebClient
        token = os.getenv("SLACK_BOT_TOKEN", "")
        channel = os.getenv("SLACK_CHANNEL_ID", "")
        if not token or not channel:
            return {"status": "not_configured"}
        client = AsyncWebClient(token=token)
        r = await client.chat_postMessage(channel=channel, text=args["message"])
        return {"status": "ok", "ts": r.get("ts")}

    else:
        return {"error": f"Unknown tool: {tool_name}"}
