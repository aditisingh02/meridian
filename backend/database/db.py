"""
Meridian SQLite persistence layer.
Two tables: events (all webhook events) and incidents (open/resolved issues).
"""
import aiosqlite
import datetime
import os
import uuid
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "meridian.db")


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id          TEXT PRIMARY KEY,
                type        TEXT NOT NULL,
                message     TEXT NOT NULL,
                source      TEXT NOT NULL DEFAULT 'openmetadata',
                table_fqn   TEXT,
                timestamp   TEXT NOT NULL,
                raw_payload TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id          TEXT PRIMARY KEY,
                severity    TEXT NOT NULL,
                title       TEXT NOT NULL,
                table_fqn   TEXT,
                owner       TEXT,
                status      TEXT NOT NULL DEFAULT 'open',
                created_at  TEXT NOT NULL,
                resolved_at TEXT
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp DESC)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)")
        await db.commit()


async def save_event(
    event_type: str,
    message: str,
    source: str = "openmetadata",
    table_fqn: Optional[str] = None,
    raw_payload: Optional[str] = None,
) -> dict:
    """Persist a webhook event. Returns the saved event dict."""
    event_id = uuid.uuid4().hex
    timestamp = datetime.datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """INSERT INTO events (id, type, message, source, table_fqn, timestamp, raw_payload)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (event_id, event_type, message, source, table_fqn, timestamp, raw_payload),
        )
        await db.commit()
    return {
        "id": event_id,
        "type": event_type,
        "message": message,
        "source": source,
        "table_fqn": table_fqn,
        "timestamp": timestamp,
    }


async def save_incident(
    severity: str,
    title: str,
    table_fqn: Optional[str] = None,
    owner: Optional[str] = None,
) -> dict:
    """Create a new incident record. Auto-pages PagerDuty for critical severity."""
    incident_id = uuid.uuid4().hex
    created_at  = datetime.datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO incidents (id, severity, title, table_fqn, owner, status, created_at)
               VALUES (?, ?, ?, ?, ?, 'open', ?)""",
            (incident_id, severity, title, table_fqn, owner, created_at),
        )
        await db.commit()

    incident = {
        "id":         incident_id,
        "severity":   severity,
        "title":      title,
        "table_fqn":  table_fqn,
        "owner":      owner,
        "status":     "open",
        "created_at": created_at,
    }

    # Auto-page PagerDuty for critical incidents
    if severity == "critical":
        try:
            from integrations.pagerduty_client import trigger_incident
            await trigger_incident(
                summary   = title,
                severity  = "critical",
                source    = "Meridian",
                dedup_key = incident_id,
                component = table_fqn or "data-estate",
                details   = {"table_fqn": table_fqn, "owner": owner, "incident_id": incident_id},
            )
        except Exception as e:
            import logging
            logging.error(f"PagerDuty trigger failed: {e}")

    return incident


async def resolve_incident(incident_id: str) -> bool:
    """Mark an incident resolved. Also resolves PagerDuty alert if active."""
    resolved_at = datetime.datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        # Check severity before resolving
        row = await (await db.execute(
            "SELECT severity FROM incidents WHERE id=? AND status='open'", (incident_id,)
        )).fetchone()
        cur = await db.execute(
            "UPDATE incidents SET status='resolved', resolved_at=? WHERE id=? AND status='open'",
            (resolved_at, incident_id),
        )
        await db.commit()
        if cur.rowcount > 0 and row and row["severity"] == "critical":
            try:
                from integrations.pagerduty_client import resolve_incident as pd_resolve
                await pd_resolve(dedup_key=incident_id)
            except Exception as e:
                import logging
                logging.error(f"PagerDuty resolve failed: {e}")
        return cur.rowcount > 0


async def get_events(limit: int = 50, offset: int = 0) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT * FROM events ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        rows = await cur.fetchall()
        return [dict(r) for r in rows]


async def get_incidents(status: Optional[str] = None) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if status:
            cur = await db.execute(
                "SELECT * FROM incidents WHERE status=? ORDER BY created_at DESC",
                (status,),
            )
        else:
            cur = await db.execute("SELECT * FROM incidents ORDER BY created_at DESC")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]


async def get_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        total_events = (await (await db.execute("SELECT COUNT(*) FROM events")).fetchone())[0]
        open_incidents = (await (await db.execute("SELECT COUNT(*) FROM incidents WHERE status='open'")).fetchone())[0]
        pii_events = (await (await db.execute("SELECT COUNT(*) FROM events WHERE type='pii_detected'")).fetchone())[0]
        schema_events = (await (await db.execute("SELECT COUNT(*) FROM events WHERE type='schema_change'")).fetchone())[0]
        critical_incidents = (await (await db.execute(
            "SELECT COUNT(*) FROM incidents WHERE status='open' AND severity='critical'"
        )).fetchone())[0]
    return {
        "total_events": total_events,
        "open_incidents": open_incidents,
        "critical_incidents": critical_incidents,
        "pii_detections": pii_events,
        "schema_changes": schema_events,
    }
