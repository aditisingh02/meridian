"""
Executive Intelligence — Cross-domain aggregation + AI-generated brief.
Aggregates HR, Finance, PM, and GitHub signals into a leadership-level summary.
"""
import os
from intelligence import hr_intelligence, finance_intelligence, pm_intelligence, github_agent
from ai.llm import LLMClient
from typing import Any

llm = LLMClient()


def _three_tier(signals: dict) -> str:
    """Derive overall status from sub-domain signals."""
    off_track = 0
    at_risk   = 0

    pm_status = signals.get("pm", {}).get("delivery_confidence", {}).get("status", "")
    if pm_status == "OFF_TRACK":
        off_track += 1
    elif pm_status == "AT_RISK":
        at_risk += 1

    fin_status = signals.get("finance", {}).get("budget_health", "")
    if fin_status == "OFF_TRACK":
        off_track += 1
    elif fin_status == "AT_RISK":
        at_risk += 1

    hr_level = signals.get("hr", {}).get("team_burnout_risk", {}).get("level", "")
    if hr_level == "HIGH":
        off_track += 1
    elif hr_level == "MEDIUM":
        at_risk += 1

    if off_track >= 2:
        return "OFF_TRACK"
    if off_track >= 1 or at_risk >= 2:
        return "AT_RISK"
    return "ON_TRACK"


async def get_signals(days: int = 14) -> dict[str, Any]:
    """Gather all intelligence signals in parallel."""
    import asyncio
    hr, finance, pm, github = await asyncio.gather(
        hr_intelligence.analyse(days=days),
        finance_intelligence.analyse(days=days),
        pm_intelligence.analyse(days=days),
        github_agent.analyse(days=days),
        return_exceptions=True,
    )

    # Replace exceptions with empty dicts
    signals = {
        "hr":      hr      if isinstance(hr,      dict) else {},
        "finance": finance if isinstance(finance,  dict) else {},
        "pm":      pm      if isinstance(pm,       dict) else {},
        "github":  github  if isinstance(github,   dict) else {},
    }
    signals["overall_status"] = _three_tier(signals)
    return signals


def _format_brief_prompt(signals: dict) -> str:
    hr      = signals.get("hr", {})
    finance = signals.get("finance", {})
    pm      = signals.get("pm", {})
    github  = signals.get("github", {})

    return f"""You are an executive AI assistant. Generate a concise leadership brief (max 200 words) based on the following engineering intelligence signals.

HR:
- Team burnout risk: {hr.get('team_burnout_risk', {}).get('level', 'N/A')}
- After-hours work: {hr.get('after_hours_pct', 'N/A')}%
- Weekend commits: {hr.get('weekend_work_pct', 'N/A')}%

Finance:
- Budget health: {finance.get('budget_health', 'N/A')}
- Engineering cost (period): ${finance.get('total_cost_usd', 'N/A')}
- ROI score: {finance.get('roi_score', 'N/A')}
- Active risks: {len(finance.get('risk_radar', []))}

PM:
- Sprint: {pm.get('sprint_name', 'N/A')}
- Completion: {pm.get('completion_pct', 'N/A')}%
- Delivery confidence: {pm.get('delivery_confidence', {}).get('status', 'N/A')}
- Scope creep: {pm.get('scope_creep_pct', 'N/A')}%
- Blocked issues: {pm.get('blocked_issues', 'N/A')}

GitHub:
- PRs merged: {github.get('pr_metrics', {}).get('closed_prs', 'N/A')}
- Avg cycle time: {github.get('pr_metrics', {}).get('avg_cycle_hours', 'N/A')}h
- Quick merges (<2h): {github.get('quick_merges', 'N/A')}

Overall status: {signals.get('overall_status', 'N/A')}

Write a concise executive brief with: 1) Overall assessment, 2) Top 2 risks, 3) Recommended actions."""


async def get_brief(days: int = 14) -> dict[str, Any]:
    """Generate an AI executive brief."""
    signals = await get_signals(days=days)
    prompt  = _format_brief_prompt(signals)

    try:
        brief_text = await llm.generate_nlq_response(prompt, "")
    except Exception as e:
        brief_text = f"AI brief unavailable: {e}"

    return {
        "signals": signals,
        "brief":   brief_text,
        "status":  signals.get("overall_status", "UNKNOWN"),
    }


def _nine_panel_dashboard(signals: dict) -> list[dict]:
    """Return structured 9-panel data for the frontend grid."""
    hr = signals.get("hr", {})
    fi = signals.get("finance", {})
    pm = signals.get("pm", {})
    gh = signals.get("github", {})

    return [
        {"id": "overall",      "title": "Overall Health",        "value": signals.get("overall_status", "—"),    "type": "status"},
        {"id": "burnout",      "title": "Burnout Risk",          "value": hr.get("team_burnout_risk", {}).get("level", "—"), "type": "risk"},
        {"id": "after_hours",  "title": "After-Hours Work",      "value": f"{hr.get('after_hours_pct', 0)}%",    "type": "metric"},
        {"id": "budget",       "title": "Budget Health",         "value": fi.get("budget_health", "—"),          "type": "status"},
        {"id": "roi",          "title": "Engineering ROI",       "value": str(fi.get("roi_score", "—")),         "type": "metric"},
        {"id": "sprint",       "title": "Sprint Completion",     "value": f"{pm.get('completion_pct', 0)}%",     "type": "progress"},
        {"id": "confidence",   "title": "Delivery Confidence",   "value": pm.get("delivery_confidence", {}).get("status", "—"), "type": "status"},
        {"id": "scope_creep",  "title": "Scope Creep",           "value": f"{pm.get('scope_creep_pct', 0)}%",   "type": "metric"},
        {"id": "pr_cycle",     "title": "Avg PR Cycle Time",     "value": f"{gh.get('pr_metrics', {}).get('avg_cycle_hours', '—')}h", "type": "metric"},
    ]
