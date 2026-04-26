"""
Agent Memory — Circular buffer of recent agent runs.
Keeps the last MAX_RUNS agent executions in memory for the history endpoint.
"""
import time
from collections import deque
from typing import Any

MAX_RUNS = 20

_history: deque[dict[str, Any]] = deque(maxlen=MAX_RUNS)


def record_run(run: dict[str, Any]) -> None:
    """Append a completed agent run to the history buffer."""
    _history.appendleft({**run, "recorded_at": time.time()})


def get_history(limit: int = 10) -> list[dict[str, Any]]:
    """Return the most recent N agent runs."""
    return list(_history)[:limit]
