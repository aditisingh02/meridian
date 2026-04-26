"""
GitHub REST API client.
Handles PR analysis, commit patterns, review metrics.
Requires: GITHUB_TOKEN, GITHUB_ORG (or GITHUB_REPO)
"""
import os
import httpx
from datetime import datetime, timezone, timedelta
from typing import Any

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_ORG   = os.getenv("GITHUB_ORG", "")
GITHUB_REPO  = os.getenv("GITHUB_REPO", "")   # owner/repo  e.g. "aditisingh/meridian"

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}" if GITHUB_TOKEN else "",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

BASE = "https://api.github.com"


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=BASE, headers=HEADERS, timeout=15)


async def get_recent_prs(days: int = 30) -> list[dict[str, Any]]:
    """Return PRs (open + closed) from the last N days across the org or repo."""
    if not GITHUB_TOKEN:
        return []

    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    if GITHUB_REPO:
        query = f"repo:{GITHUB_REPO} is:pr created:>{since}"
    elif GITHUB_ORG:
        query = f"org:{GITHUB_ORG} is:pr created:>{since}"
    else:
        return []

    async with _client() as c:
        r = await c.get("/search/issues", params={"q": query, "per_page": 100, "sort": "created"})
        if r.status_code != 200:
            return []
        items = r.json().get("items", [])

    results = []
    for pr in items:
        created = pr.get("created_at", "")
        closed  = pr.get("closed_at")
        cycle_h = None
        if created and closed:
            delta = datetime.fromisoformat(closed.replace("Z", "+00:00")) - \
                    datetime.fromisoformat(created.replace("Z", "+00:00"))
            cycle_h = round(delta.total_seconds() / 3600, 1)

        results.append({
            "number":    pr.get("number"),
            "title":     pr.get("title", ""),
            "state":     pr.get("state"),
            "author":    pr.get("user", {}).get("login", "unknown"),
            "created_at":created,
            "closed_at": closed,
            "cycle_hours": cycle_h,
            "comments":  pr.get("comments", 0),
            "url":       pr.get("html_url", ""),
            "labels":    [lb["name"] for lb in pr.get("labels", [])],
        })

    return results


async def get_commit_activity(days: int = 30) -> dict[str, Any]:
    """Analyse commit timestamps for after-hours and weekend patterns."""
    if not GITHUB_REPO or not GITHUB_TOKEN:
        return {}

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    async with _client() as c:
        r = await c.get(f"/repos/{GITHUB_REPO}/commits",
                        params={"since": since, "per_page": 100})
        if r.status_code != 200:
            return {}
        commits = r.json()

    total = len(commits)
    after_hours = 0
    weekend = 0
    per_author: dict[str, int] = {}

    for commit in commits:
        date_str = commit.get("commit", {}).get("author", {}).get("date", "")
        author   = commit.get("author") or {}
        login    = author.get("login", commit.get("commit", {}).get("author", {}).get("name", "unknown"))
        per_author[login] = per_author.get(login, 0) + 1

        if date_str:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            if dt.weekday() >= 5:
                weekend += 1
            if dt.hour < 9 or dt.hour >= 19:
                after_hours += 1

    return {
        "total_commits":    total,
        "after_hours":      after_hours,
        "after_hours_pct":  round(after_hours / total * 100, 1) if total else 0,
        "weekend_commits":  weekend,
        "weekend_pct":      round(weekend / total * 100, 1) if total else 0,
        "per_author":       per_author,
        "days_analysed":    days,
    }


async def get_review_metrics(prs: list[dict]) -> dict[str, Any]:
    """Derive review depth metrics from PR list."""
    if not prs:
        return {}
    cycle_times = [p["cycle_hours"] for p in prs if p["cycle_hours"] is not None]
    comment_counts = [p["comments"] for p in prs]
    return {
        "total_prs":          len(prs),
        "avg_cycle_hours":    round(sum(cycle_times) / len(cycle_times), 1) if cycle_times else None,
        "median_cycle_hours": sorted(cycle_times)[len(cycle_times)//2] if cycle_times else None,
        "avg_comments":       round(sum(comment_counts) / len(comment_counts), 1) if comment_counts else 0,
        "open_prs":           sum(1 for p in prs if p["state"] == "open"),
        "closed_prs":         sum(1 for p in prs if p["state"] == "closed"),
    }
