"""
PM Intelligence — Delivery confidence, scope creep detection, dependency risk.
Powered by Jira sprint data + GitHub PR velocity.
"""
from integrations.jira_client import get_sprint_metrics, get_pending_issues
from integrations.github_client import get_recent_prs
from typing import Any


def _confidence_level(pct: float, scope_creep: float, blocked: int) -> dict[str, Any]:
    score = pct
    score -= scope_creep * 0.5
    score -= blocked * 3
    score = max(0, min(100, score))
    if score >= 70:
        status = "ON_TRACK"
    elif score >= 40:
        status = "AT_RISK"
    else:
        status = "OFF_TRACK"
    return {"score": round(score, 1), "status": status}


async def analyse(days: int = 14) -> dict[str, Any]:
    sprint  = await get_sprint_metrics(days=days)
    pending = await get_pending_issues()
    prs     = await get_recent_prs(days=days)

    if not sprint.get("configured"):
        return {"configured": False, "message": "Set JIRA_* env vars to enable PM intelligence."}

    if sprint.get("sprint") is None:
        return {"configured": True, "sprint": None, "message": "No active sprint found."}

    # Blocked / dependency risk
    blocked = [i for i in pending if "blocked" in i.get("status", "").lower()
               or "impediment" in i.get("status", "").lower()]

    # Scope creep
    scope_creep_pct = sprint.get("scope_creep_pct", 0)

    # Delivery confidence
    completion_pct = sprint.get("completion_pct", 0)
    confidence = _confidence_level(completion_pct, scope_creep_pct, len(blocked))

    # PR velocity as proxy for engineering momentum
    closed_prs = sum(1 for p in prs if p["state"] == "closed")
    open_prs   = sum(1 for p in prs if p["state"] == "open")

    # Risk signals
    risks = []
    if scope_creep_pct > 15:
        risks.append({
            "type": "SCOPE_CREEP",
            "severity": "high" if scope_creep_pct > 25 else "medium",
            "desc": f"Sprint scope grew by {scope_creep_pct}% after start."
        })
    if len(blocked) > 0:
        risks.append({
            "type": "DEPENDENCY_BLOCK",
            "severity": "high" if len(blocked) > 2 else "medium",
            "desc": f"{len(blocked)} issue(s) blocked on external dependencies."
        })
    if open_prs > closed_prs * 2:
        risks.append({
            "type": "PR_BACKLOG",
            "severity": "medium",
            "desc": f"{open_prs} open PRs vs {closed_prs} closed — review backlog building."
        })

    return {
        "configured":        True,
        "sprint_name":       sprint.get("sprint_name", ""),
        "sprint_goal":       sprint.get("sprint_goal", ""),
        "total_issues":      sprint.get("total_issues", 0),
        "done":              sprint.get("done", 0),
        "in_progress":       sprint.get("in_progress", 0),
        "todo":              sprint.get("todo", 0),
        "completion_pct":    completion_pct,
        "scope_creep_pct":   scope_creep_pct,
        "scope_added":       sprint.get("scope_added", 0),
        "blocked_issues":    len(blocked),
        "blocked_details":   blocked[:5],
        "delivery_confidence": confidence,
        "pr_velocity":       {"closed": closed_prs, "open": open_prs},
        "risks":             risks,
        "pending_issues":    pending[:10],
    }
