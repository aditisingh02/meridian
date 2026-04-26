"""
Jira REST API client.
Handles issue tracking, sprint metrics, board data.
Requires: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN
"""
import os
import base64
import httpx
from typing import Any

JIRA_BASE_URL   = os.getenv("JIRA_BASE_URL", "").rstrip("/")
JIRA_EMAIL      = os.getenv("JIRA_EMAIL", "")
JIRA_API_TOKEN  = os.getenv("JIRA_API_TOKEN", "")
JIRA_PROJECT    = os.getenv("JIRA_PROJECT_KEY", "")
JIRA_BOARD_ID   = os.getenv("JIRA_BOARD_ID", "")

def _auth_header() -> str:
    raw = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
    return "Basic " + base64.b64encode(raw.encode()).decode()

def _configured() -> bool:
    return bool(JIRA_BASE_URL and JIRA_EMAIL and JIRA_API_TOKEN)

def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=f"{JIRA_BASE_URL}/rest/api/3",
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        timeout=15,
    )


async def get_active_sprint() -> dict[str, Any] | None:
    """Return the current active sprint for the configured board."""
    if not _configured() or not JIRA_BOARD_ID:
        return None
    async with httpx.AsyncClient(
        base_url=f"{JIRA_BASE_URL}/rest/agile/1.0",
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        timeout=15,
    ) as c:
        r = await c.get(f"/board/{JIRA_BOARD_ID}/sprint", params={"state": "active"})
        if r.status_code != 200:
            return None
        sprints = r.json().get("values", [])
        return sprints[0] if sprints else None


async def get_sprint_issues(sprint_id: int) -> list[dict[str, Any]]:
    """Return all issues in a sprint."""
    if not _configured():
        return []
    async with httpx.AsyncClient(
        base_url=f"{JIRA_BASE_URL}/rest/agile/1.0",
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        timeout=15,
    ) as c:
        r = await c.get(f"/sprint/{sprint_id}/issue", params={
            "fields": "summary,status,assignee,priority,created,updated,storyPoints,labels",
            "maxResults": 200,
        })
        if r.status_code != 200:
            return []
        return r.json().get("issues", [])


async def get_sprint_metrics(days: int = 14) -> dict[str, Any]:
    """Aggregate sprint health metrics."""
    if not _configured():
        return {"configured": False}

    sprint = await get_active_sprint()
    if not sprint:
        return {"configured": True, "sprint": None}

    issues = await get_sprint_issues(sprint["id"])
    total = len(issues)
    done = sum(1 for i in issues if i["fields"]["status"]["statusCategory"]["key"] == "done")
    in_progress = sum(1 for i in issues if i["fields"]["status"]["statusCategory"]["key"] == "indeterminate")
    todo = total - done - in_progress

    # Scope creep: issues added after sprint start
    sprint_start = sprint.get("startDate", "")
    scope_added = 0
    if sprint_start:
        for issue in issues:
            created = issue["fields"].get("created", "")
            if created and created > sprint_start:
                scope_added += 1

    return {
        "configured":    True,
        "sprint_name":   sprint.get("name", ""),
        "sprint_goal":   sprint.get("goal", ""),
        "total_issues":  total,
        "done":          done,
        "in_progress":   in_progress,
        "todo":          todo,
        "completion_pct": round(done / total * 100, 1) if total else 0,
        "scope_added":   scope_added,
        "scope_creep_pct": round(scope_added / total * 100, 1) if total else 0,
    }


async def get_pending_issues(jql: str | None = None) -> list[dict[str, Any]]:
    """Return pending/blocked issues."""
    if not _configured():
        return []
    jql = jql or (f"project = {JIRA_PROJECT} AND resolution = EMPTY ORDER BY updated DESC" if JIRA_PROJECT else "resolution = EMPTY ORDER BY updated DESC")
    async with _client() as c:
        r = await c.get("/search", params={
            "jql": jql,
            "fields": "summary,status,assignee,priority,created,labels",
            "maxResults": 50,
        })
        if r.status_code != 200:
            return []
        issues = r.json().get("issues", [])
        return [
            {
                "key":      i["key"],
                "summary":  i["fields"]["summary"],
                "status":   i["fields"]["status"]["name"],
                "assignee": (i["fields"].get("assignee") or {}).get("displayName", "Unassigned"),
                "priority": i["fields"].get("priority", {}).get("name", "Medium"),
                "created":  i["fields"].get("created", ""),
            }
            for i in issues
        ]


async def create_issue(
    summary: str,
    description: str = "",
    priority: str = "Medium",
    issue_type: str = "Task",
) -> dict[str, Any]:
    """Create a new Jira issue in the configured project."""
    if not _configured() or not JIRA_PROJECT:
        return {"status": "not_configured", "message": "JIRA_* env vars or JIRA_PROJECT_KEY not set"}

    payload: dict[str, Any] = {
        "fields": {
            "project":   {"key": JIRA_PROJECT},
            "summary":   summary,
            "issuetype": {"name": issue_type},
            "priority":  {"name": priority},
        }
    }
    if description:
        payload["fields"]["description"] = {
            "type":    "doc",
            "version": 1,
            "content": [
                {
                    "type":    "paragraph",
                    "content": [{"type": "text", "text": description}],
                }
            ],
        }

    async with httpx.AsyncClient(
        base_url=f"{JIRA_BASE_URL}/rest/api/3",
        headers={
            "Authorization": _auth_header(),
            "Accept":        "application/json",
            "Content-Type":  "application/json",
        },
        timeout=15,
    ) as c:
        r = await c.post("/issue", json=payload)
        if r.status_code not in (200, 201):
            return {"status": "error", "code": r.status_code, "body": r.text}
        data = r.json()
        return {
            "status": "created",
            "key":    data.get("key"),
            "id":     data.get("id"),
            "url":    f"{JIRA_BASE_URL}/browse/{data.get('key')}",
        }

