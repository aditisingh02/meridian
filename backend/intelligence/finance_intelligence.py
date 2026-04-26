"""
Finance Intelligence — Engineering ROI, cost monitoring, risk radar, feature costing.
Derived from GitHub PR velocity and Jira sprint data.
"""
from integrations.github_client import get_recent_prs, get_commit_activity
from integrations.jira_client import get_sprint_metrics
from typing import Any
import os

# Cost assumptions (configurable via env)
AVG_ENG_HOURLY_COST = float(os.getenv("ENG_HOURLY_COST_USD", "85"))
SPRINT_WEEKS        = float(os.getenv("SPRINT_WEEKS", "2"))
TEAM_SIZE           = int(os.getenv("TEAM_SIZE", "5"))
WORK_HOURS_PER_DAY  = 8


async def analyse(days: int = 30) -> dict[str, Any]:
    prs     = await get_recent_prs(days=days)
    commits = await get_commit_activity(days=days)
    sprint  = await get_sprint_metrics()

    # Engineering cost
    total_eng_hours = days * WORK_HOURS_PER_DAY * TEAM_SIZE
    total_cost_usd  = round(total_eng_hours * AVG_ENG_HOURLY_COST, 0)

    # Velocity proxy: closed PRs
    closed_prs = [p for p in prs if p["state"] == "closed"]
    throughput_score = len(closed_prs)

    # ROI estimate: closed PRs per $10k spent
    cost_per_pr = round(total_cost_usd / len(closed_prs), 0) if closed_prs else None
    roi_score   = round((len(closed_prs) / (total_cost_usd / 10_000)), 2) if total_cost_usd > 0 and closed_prs else 0

    # Waste signals
    avg_cycle = None
    cycle_times = [p["cycle_hours"] for p in prs if p["cycle_hours"] is not None]
    if cycle_times:
        avg_cycle = round(sum(cycle_times) / len(cycle_times), 1)

    waste_hours = round((commits.get("after_hours_pct", 0) / 100) * total_eng_hours, 0)

    # Risk radar
    risks = []
    if avg_cycle and avg_cycle > 72:
        risks.append({"type": "CYCLE_TIME", "severity": "high",
                      "desc": f"Avg PR cycle time is {avg_cycle}h — reviews are bottlenecked."})
    if commits.get("after_hours_pct", 0) > 30:
        risks.append({"type": "OVERTIME_BURN", "severity": "medium",
                      "desc": f"{commits['after_hours_pct']}% of commits happen after hours — cost inefficiency risk."})
    if sprint.get("scope_creep_pct", 0) > 20:
        risks.append({"type": "SCOPE_CREEP", "severity": "high",
                      "desc": f"Sprint scope grew {sprint['scope_creep_pct']}% — budget overrun likely."})

    # Sprint cost
    sprint_cost = round(SPRINT_WEEKS * 5 * WORK_HOURS_PER_DAY * TEAM_SIZE * AVG_ENG_HOURLY_COST, 0)

    return {
        "period_days":       days,
        "team_size":         TEAM_SIZE,
        "total_eng_hours":   total_eng_hours,
        "total_cost_usd":    total_cost_usd,
        "sprint_cost_usd":   sprint_cost,
        "closed_prs":        len(closed_prs),
        "cost_per_pr_usd":   cost_per_pr,
        "roi_score":         roi_score,
        "throughput_score":  throughput_score,
        "avg_cycle_hours":   avg_cycle,
        "waste_hours":       waste_hours,
        "risk_radar":        risks,
        "budget_health":     "ON_TRACK" if not risks else ("AT_RISK" if len(risks) == 1 else "OFF_TRACK"),
    }
