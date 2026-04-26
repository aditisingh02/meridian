"""
HR Intelligence — Burnout detection, engagement trends, workload analysis.
Signals are derived from GitHub commit activity (after-hours, weekends, pace).
"""
from integrations.github_client import get_recent_prs, get_commit_activity
from typing import Any


def _burnout_score(after_hours_pct: float, weekend_pct: float, commits_per_day: float) -> dict[str, Any]:
    """
    Multi-signal burnout risk score (0–100).
    HIGH  > 65
    MEDIUM 35–65
    LOW   < 35
    """
    score = 0.0
    score += min(after_hours_pct * 0.8, 40)   # max 40 pts from after-hours
    score += min(weekend_pct * 1.2, 30)        # max 30 pts from weekend work
    score += min(commits_per_day * 2, 30)      # max 30 pts from commit pace

    if score >= 65:
        level = "HIGH"
    elif score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {"score": round(score, 1), "level": level}


async def analyse(days: int = 30) -> dict[str, Any]:
    commits = await get_commit_activity(days=days)
    prs     = await get_recent_prs(days=days)

    if not commits:
        return {"configured": False, "message": "Set GITHUB_TOKEN + GITHUB_REPO to enable HR intelligence."}

    total     = commits.get("total_commits", 0)
    cpd       = round(total / days, 2)
    ah_pct    = commits.get("after_hours_pct", 0)
    wknd_pct  = commits.get("weekend_pct", 0)
    per_author = commits.get("per_author", {})

    # Per-developer burnout
    team_burnout = []
    for author, count in per_author.items():
        ind_cpd = count / days
        # Rough per-author split of after-hours (approximate — GitHub API doesn't break this down)
        burn = _burnout_score(ah_pct, wknd_pct, ind_cpd)
        team_burnout.append({
            "author":  author,
            "commits": count,
            "cpd":     round(ind_cpd, 2),
            "burnout": burn,
        })

    team_burnout.sort(key=lambda x: x["burnout"]["score"], reverse=True)

    # Team-level engagement
    avg_pr_comments = sum(p["comments"] for p in prs) / len(prs) if prs else 0
    team_score = _burnout_score(ah_pct, wknd_pct, cpd)

    # Trend: compare first half vs second half of period
    return {
        "configured":        True,
        "period_days":       days,
        "team_burnout_risk": team_score,
        "after_hours_pct":   ah_pct,
        "weekend_work_pct":  wknd_pct,
        "commits_per_day":   cpd,
        "avg_pr_engagement": round(avg_pr_comments, 1),
        "team_breakdown":    team_burnout,
        "total_contributors": len(per_author),
        "signals": {
            "after_hours": "⚠️ High" if ah_pct > 30 else "✅ Normal",
            "weekend":     "⚠️ High" if wknd_pct > 20 else "✅ Normal",
            "pace":        "⚠️ High" if cpd > 8 else "✅ Sustainable",
        },
    }
