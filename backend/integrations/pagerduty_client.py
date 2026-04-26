"""
PagerDuty Events API v2 client.
Triggers alerts when Meridian incidents reach critical severity.
Requires: PAGERDUTY_ROUTING_KEY
"""
import os
import httpx
import logging
from typing import Any

ROUTING_KEY = os.getenv("PAGERDUTY_ROUTING_KEY", "")
EVENTS_URL  = "https://events.pagerduty.com/v2/enqueue"


def _configured() -> bool:
    return bool(ROUTING_KEY)


async def trigger_incident(
    summary: str,
    severity: str = "critical",
    source: str = "Meridian",
    dedup_key: str | None = None,
    details: dict[str, Any] | None = None,
    component: str | None = None,
    group: str | None = None,
) -> dict[str, Any]:
    """
    Trigger a PagerDuty alert.
    severity: critical | error | warning | info
    Returns the PagerDuty API response.
    """
    if not _configured():
        logging.warning("PagerDuty not configured — set PAGERDUTY_ROUTING_KEY")
        return {"status": "not_configured"}

    payload: dict[str, Any] = {
        "routing_key":  ROUTING_KEY,
        "event_action": "trigger",
        "payload": {
            "summary":   summary,
            "severity":  severity,
            "source":    source,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        },
    }
    if dedup_key:
        payload["dedup_key"] = dedup_key
    if details:
        payload["payload"]["custom_details"] = details
    if component:
        payload["payload"]["component"] = component
    if group:
        payload["payload"]["group"] = group

    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.post(EVENTS_URL, json=payload)
        if r.status_code not in (200, 202):
            logging.error(f"PagerDuty trigger failed: {r.status_code} {r.text}")
            return {"status": "error", "code": r.status_code, "body": r.text}
        logging.info(f"PagerDuty alert triggered: {summary}")
        return r.json()


async def resolve_incident(dedup_key: str) -> dict[str, Any]:
    """Resolve a PagerDuty alert by dedup_key."""
    if not _configured():
        return {"status": "not_configured"}

    payload = {
        "routing_key":  ROUTING_KEY,
        "event_action": "resolve",
        "dedup_key":    dedup_key,
    }
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.post(EVENTS_URL, json=payload)
        return r.json()


async def acknowledge_incident(dedup_key: str) -> dict[str, Any]:
    """Acknowledge a PagerDuty alert."""
    if not _configured():
        return {"status": "not_configured"}

    payload = {
        "routing_key":  ROUTING_KEY,
        "event_action": "acknowledge",
        "dedup_key":    dedup_key,
    }
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.post(EVENTS_URL, json=payload)
        return r.json()
