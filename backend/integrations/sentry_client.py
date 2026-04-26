"""
Sentry API client + error-to-data correlation engine.
Fetches recent Sentry issues and correlates error spikes with data quality failures.
Requires: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
"""
import os
import httpx
import logging
from typing import Any

SENTRY_TOKEN   = os.getenv("SENTRY_AUTH_TOKEN", "")
SENTRY_ORG     = os.getenv("SENTRY_ORG", "")
SENTRY_PROJECT = os.getenv("SENTRY_PROJECT", "")
SENTRY_BASE    = "https://sentry.io/api/0"

# Keywords that suggest data pipeline involvement
DATA_KEYWORDS = [
    "database", "db", "query", "sql", "table", "schema", "null", "column",
    "pipeline", "etl", "dbt", "airflow", "bigquery", "snowflake", "postgres",
    "mysql", "connection", "timeout", "stale", "freshness", "integrity",
]


def _configured() -> bool:
    return bool(SENTRY_TOKEN and SENTRY_ORG and SENTRY_PROJECT)


def _headers() -> dict:
    return {"Authorization": f"Bearer {SENTRY_TOKEN}"}


async def get_recent_issues(limit: int = 25) -> list[dict[str, Any]]:
    """Fetch recent unresolved Sentry issues."""
    if not _configured():
        return []

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(
            f"{SENTRY_BASE}/projects/{SENTRY_ORG}/{SENTRY_PROJECT}/issues/",
            params={"query": "is:unresolved", "limit": limit, "sort": "date"},
        )
        if r.status_code != 200:
            logging.error(f"Sentry API error: {r.status_code} {r.text[:200]}")
            return []
        return r.json()


async def get_issue_events(issue_id: str, limit: int = 5) -> list[dict[str, Any]]:
    """Fetch recent events for a specific Sentry issue."""
    if not _configured():
        return []

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(
            f"{SENTRY_BASE}/issues/{issue_id}/events/",
            params={"limit": limit},
        )
        if r.status_code != 200:
            return []
        return r.json()


async def get_project_stats(stat: str = "received", resolution: str = "1h") -> list:
    """Get project-level event volume stats."""
    if not _configured():
        return []

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(
            f"{SENTRY_BASE}/projects/{SENTRY_ORG}/{SENTRY_PROJECT}/stats/",
            params={"stat": stat, "resolution": resolution},
        )
        if r.status_code != 200:
            return []
        return r.json()


def _is_data_related(issue: dict) -> bool:
    """Detect if a Sentry issue is likely related to a data pipeline."""
    title  = (issue.get("title") or "").lower()
    culprit = (issue.get("culprit") or "").lower()
    metadata = issue.get("metadata", {})
    value  = (metadata.get("value") or "").lower()

    text = f"{title} {culprit} {value}"
    return any(kw in text for kw in DATA_KEYWORDS)


async def analyse() -> dict[str, Any]:
    """Full Sentry health summary with data-pipeline correlation."""
    if not _configured():
        return {"configured": False, "message": "Set SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT to enable."}

    issues = await get_recent_issues(limit=50)
    if not isinstance(issues, list):
        issues = []

    total    = len(issues)
    critical = [i for i in issues if i.get("level") in ("fatal", "error")]
    warnings = [i for i in issues if i.get("level") == "warning"]

    # Data-related errors
    data_errors = [i for i in issues if _is_data_related(i)]

    # Error volume trend (events count)
    stats = await get_project_stats()
    recent_volume  = sum(s[1] for s in stats[-6:])  if stats else 0
    previous_volume = sum(s[1] for s in stats[-12:-6]) if stats else 0
    volume_delta   = round((recent_volume - previous_volume) / max(previous_volume, 1) * 100, 1)

    # Format top issues
    def _fmt(issue: dict) -> dict:
        return {
            "id":          issue.get("id"),
            "title":       issue.get("title", ""),
            "level":       issue.get("level", ""),
            "count":       issue.get("count", 0),
            "user_count":  issue.get("userCount", 0),
            "first_seen":  issue.get("firstSeen"),
            "last_seen":   issue.get("lastSeen"),
            "culprit":     issue.get("culprit", ""),
            "data_related": _is_data_related(issue),
            "url":         issue.get("permalink", ""),
        }

    return {
        "configured":      True,
        "total_unresolved": total,
        "critical":        len(critical),
        "warnings":        len(warnings),
        "data_related":    len(data_errors),
        "volume_delta_pct": volume_delta,
        "error_trend":     "spiking" if volume_delta > 20 else ("stable" if abs(volume_delta) <= 10 else "declining"),
        "health":          "OFF_TRACK" if len(critical) > 5 else ("AT_RISK" if len(critical) > 0 else "ON_TRACK"),
        "top_issues":      [_fmt(i) for i in issues[:10]],
        "data_errors":     [_fmt(i) for i in data_errors[:5]],
        "correlation_note": (
            f"{len(data_errors)} error(s) appear related to data pipelines. "
            "Check table freshness and quality tests." if data_errors
            else "No data-pipeline errors detected."
        ),
    }
