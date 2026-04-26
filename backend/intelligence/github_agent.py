"""
GitHub Agent — PR cycle time, review depth, commit pattern analysis.
"""
from integrations.github_client import get_recent_prs, get_commit_activity, get_review_metrics
from typing import Any


async def analyse(days: int = 30) -> dict[str, Any]:
    prs = await get_recent_prs(days=days)
    commits = await get_commit_activity(days=days)
    reviews = await get_review_metrics(prs)

    # PR size classification
    large_prs = [p for p in prs if p["comments"] > 10]
    quick_merges = [p for p in prs if p.get("cycle_hours") is not None and p["cycle_hours"] < 2]

    # Top contributors
    author_counts: dict[str, int] = {}
    for p in prs:
        author_counts[p["author"]] = author_counts.get(p["author"], 0) + 1
    top_contributors = sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "period_days":       days,
        "pr_metrics":        reviews,
        "commit_activity":   commits,
        "large_prs":         len(large_prs),
        "quick_merges":      len(quick_merges),
        "top_contributors":  [{"author": a, "prs": c} for a, c in top_contributors],
        "recent_prs":        prs[:10],
    }
