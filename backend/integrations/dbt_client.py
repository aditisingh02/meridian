"""
dbt Cloud REST API client.
Fetches run results, model health, and test failures.
Requires: DBT_CLOUD_TOKEN, DBT_ACCOUNT_ID
Optional: DBT_JOB_ID (limit to a specific job)
"""
import os
import httpx
from typing import Any

DBT_TOKEN      = os.getenv("DBT_CLOUD_TOKEN", "")
DBT_ACCOUNT_ID = os.getenv("DBT_ACCOUNT_ID", "")
DBT_JOB_ID     = os.getenv("DBT_JOB_ID", "")
DBT_BASE       = "https://ca605.us1.dbt.com/api/v2"


def _configured() -> bool:
    return bool(DBT_TOKEN and DBT_ACCOUNT_ID)


def _headers() -> dict:
    return {"Authorization": f"Token {DBT_TOKEN}", "Content-Type": "application/json"}


async def get_recent_runs(limit: int = 10) -> list[dict[str, Any]]:
    """Return the most recent dbt Cloud job runs."""
    if not _configured():
        return []

    params: dict[str, Any] = {"order_by": "-created_at", "limit": limit}
    if DBT_JOB_ID:
        params["job_definition_id"] = DBT_JOB_ID

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(f"{DBT_BASE}/accounts/{DBT_ACCOUNT_ID}/runs/", params=params)
        if r.status_code != 200:
            return []
        return r.json().get("data", [])


async def get_run_artifacts(run_id: int) -> dict[str, Any]:
    """Fetch the run_results.json artifact for a completed run."""
    if not _configured():
        return {}

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(
            f"{DBT_BASE}/accounts/{DBT_ACCOUNT_ID}/runs/{run_id}/artifacts/run_results.json"
        )
        if r.status_code != 200:
            return {}
        return r.json()


async def get_jobs() -> list[dict[str, Any]]:
    """List all jobs in the account."""
    if not _configured():
        return []

    async with httpx.AsyncClient(headers=_headers(), timeout=15) as c:
        r = await c.get(f"{DBT_BASE}/accounts/{DBT_ACCOUNT_ID}/jobs/")
        if r.status_code != 200:
            return []
        return r.json().get("data", [])


async def analyse() -> dict[str, Any]:
    """Full dbt Cloud health summary."""
    if not _configured():
        return {"configured": False, "message": "Set DBT_CLOUD_TOKEN + DBT_ACCOUNT_ID to enable."}

    runs = await get_recent_runs(limit=20)
    if not isinstance(runs, list):
        runs = []



    # Classify runs
    total       = len(runs)
    success     = sum(1 for r in runs if r.get("status_humanized") == "Success")
    failed      = sum(1 for r in runs if r.get("status_humanized") == "Error")
    running     = sum(1 for r in runs if r.get("status_humanized") == "Running")
    cancelled   = sum(1 for r in runs if r.get("status_humanized") == "Cancelled")
    success_pct = round(success / total * 100, 1) if total else 0

    # Latest run details
    latest = runs[0] if runs else {}
    latest_status = latest.get("status_humanized")

    # Fetch test results for latest completed run
    test_failures: list[dict] = []
    if latest_status in ("Success", "Error") and latest.get("id"):
        artifacts = await get_run_artifacts(latest["id"])
        results   = artifacts.get("results", [])
        for node in results:
            if node.get("status") in ("fail", "error") and node.get("unique_id", "").startswith("test."):
                test_failures.append({
                    "test":    node.get("unique_id", "").split(".")[-1],
                    "status":  node.get("status"),
                    "message": (node.get("message") or "")[:120],
                })

    # Duration stats
    durations = [r.get("duration") for r in runs if r.get("duration")]
    avg_duration = round(sum(durations) / len(durations), 0) if durations else None

    # Health logic
    if total == 0:
        health = "PENDING"
    else:
        health = "ON_TRACK" if success_pct >= 90 else ("AT_RISK" if success_pct >= 70 else "OFF_TRACK")

    return {
        "configured":    True,
        "total_runs":    total,
        "success":       success,
        "failed":        failed,
        "running":       running,
        "cancelled":     cancelled,
        "success_pct":   success_pct if total > 0 else "—",
        "avg_duration_s": avg_duration,
        "latest_run": {
            "id":         latest.get("id"),
            "status":     latest_status,
            "job_name":   latest.get("job", {}).get("name", ""),
            "created_at": latest.get("created_at"),
            "finished_at": latest.get("finished_at"),
            "duration_s": latest.get("duration"),
        },
        "test_failures":  test_failures,
        "health":         health,
        "recent_runs": [
            {
                "id":     r.get("id"),
                "status": r.get("status_humanized"),
                "job":    r.get("job", {}).get("name", ""),
                "duration_s": r.get("duration"),
                "created_at": r.get("created_at"),
            }
            for r in runs[:10]
        ],
    }
