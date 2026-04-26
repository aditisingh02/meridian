"""
Meridian ReAct Agent — Reason + Act loop using Groq function calling.

Flow per step:
  1. Build messages with current scratchpad
  2. Call Groq with tool schemas
  3. If model returns a tool_call → execute it, append observation
  4. If model returns a text finish → conclude
  5. Repeat up to max_steps
"""
import os
import json
import time
import logging
from typing import Any

from groq import AsyncGroq
from ai.tools import TOOL_SCHEMAS, execute_tool
from ai import agent_memory

logger = logging.getLogger(__name__)

MAX_STEPS = 8

SYSTEM_PROMPT = """You are Meridian, an autonomous data intelligence agent.

You have access to tools that let you query live data from:
- Jira (sprint health, ticket status)
- GitHub (PR metrics, commit patterns)
- Sentry (error tracking, data correlation)
- dbt Cloud (pipeline health, test failures)
- OpenMetadata (data quality, table lineage)
- PagerDuty (trigger incidents)
- Slack (post notifications)
- Internal incident database

Your job is to investigate goals thoroughly using a Reason → Act → Observe loop.
- Call relevant tools to gather data before drawing conclusions.
- For complex goals, chain multiple tool calls (e.g. check Sentry, then dbt, then lineage).
- Only trigger PagerDuty or create Jira tickets if the situation genuinely warrants it.
- When in dry_run mode, describe what actions you WOULD take instead of actually taking them.
- When you have enough information, provide a clear, concise conclusion.

Always be specific about what you found and why you reached your conclusion."""


class AgentRunner:
    def __init__(self, dry_run: bool = True):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not configured")
        self.client = AsyncGroq(api_key=api_key)
        self.dry_run = dry_run

    async def run(self, goal: str) -> dict[str, Any]:
        """
        Execute a ReAct loop for the given goal.
        Returns a structured result with all steps taken and a final conclusion.
        """
        start_ts = time.time()
        steps: list[dict[str, Any]] = []
        actions_taken: list[str] = []

        # Action tools that are blocked in dry_run mode
        ACTION_TOOLS = {"trigger_pagerduty_alert", "create_jira_ticket", "post_slack_message"}

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Goal: {goal}\n\n"
                    + (
                        "⚠️ DRY RUN MODE: Do NOT actually call trigger_pagerduty_alert, "
                        "create_jira_ticket, or post_slack_message. Instead, describe what you would do "
                        "and why in your final conclusion."
                        if self.dry_run
                        else "You are authorized to take real actions including triggering PagerDuty, creating Jira tickets, and posting to Slack."
                    )
                ),
            },
        ]

        conclusion = "Agent reached max steps without a final conclusion."

        for step_num in range(1, MAX_STEPS + 1):
            try:
                response = await self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    tools=TOOL_SCHEMAS,
                    tool_choice="auto",
                    temperature=0.1,
                    max_tokens=2048,
                )
            except Exception as e:
                logger.error(f"Groq API error at step {step_num}: {e}")
                conclusion = f"Agent stopped due to LLM error: {e}"
                break

            choice = response.choices[0]
            finish_reason = choice.finish_reason
            msg = choice.message

            # ── TEXT FINISH ──────────────────────────────────────────────────
            if finish_reason == "stop" or (not msg.tool_calls):
                conclusion = msg.content or conclusion
                steps.append({
                    "step": step_num,
                    "type": "conclusion",
                    "content": conclusion,
                })
                break

            # ── TOOL CALLS ───────────────────────────────────────────────────
            # Append assistant message with tool calls
            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in msg.tool_calls
                ],
            })

            # Execute each tool call
            for tc in msg.tool_calls:
                tool_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}

                is_action = tool_name in ACTION_TOOLS

                # In dry_run, skip action tools
                if self.dry_run and is_action:
                    observation = {
                        "dry_run": True,
                        "message": f"DRY RUN: Would have called {tool_name} with args: {args}",
                    }
                else:
                    logger.info(f"Agent step {step_num}: executing {tool_name}({args})")
                    observation = await execute_tool(tool_name, args)
                    if is_action:
                        actions_taken.append(f"{tool_name}({json.dumps(args)})")

                obs_str = json.dumps(observation, default=str)[:2000]  # cap size

                steps.append({
                    "step": step_num,
                    "type": "action" if is_action else "observation",
                    "tool": tool_name,
                    "args": args,
                    "result": observation,
                    "dry_run": self.dry_run and is_action,
                })

                # Append tool result for next iteration
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": obs_str,
                })

        duration_s = round(time.time() - start_ts, 2)

        run_result = {
            "goal":           goal,
            "dry_run":        self.dry_run,
            "steps_taken":    len(steps),
            "steps":          steps,
            "actions_taken":  actions_taken,
            "conclusion":     conclusion,
            "duration_s":     duration_s,
            "timestamp":      time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        agent_memory.record_run(run_result)
        return run_result
