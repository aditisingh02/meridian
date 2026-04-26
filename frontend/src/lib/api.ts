const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000") + "/ws/events";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MeridianEvent {
  id: string;
  type: string;
  message: string;
  source: string;
  table_fqn: string | null;
  timestamp: string;
}

export interface Incident {
  id: string;
  severity: "critical" | "warning" | "low";
  title: string;
  table_fqn: string | null;
  owner: string | null;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export interface Stats {
  total_events: number;
  open_incidents: number;
  critical_incidents: number;
  pii_detections: number;
  schema_changes: number;
}

export interface AgentStep {
  step: number;
  type: "observation" | "action" | "conclusion";
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  content?: string;
  dry_run?: boolean;
}

export interface AgentRun {
  goal: string;
  dry_run: boolean;
  steps_taken: number;
  steps: AgentStep[];
  actions_taken: string[];
  conclusion: string;
  duration_s: number;
  timestamp: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
  getEvents: (limit = 50) =>
    apiFetch<{ events: MeridianEvent[]; total: number }>(`/api/events?limit=${limit}`),

  getIncidents: (status?: "open" | "resolved") =>
    apiFetch<{ incidents: Incident[] }>(
      `/api/incidents${status ? `?status=${status}` : ""}`
    ),

  getStats: () => apiFetch<Stats>("/api/stats"),

  resolveIncident: (id: string) =>
    apiFetch<{ status: string; id: string }>(`/api/incidents/${id}/resolve`, {
      method: "PATCH",
    }),

  runAgent: (goal: string, dry_run = true) =>
    apiFetch<AgentRun>("/api/agent/run", {
      method: "POST",
      body: JSON.stringify({ goal, dry_run }),
    }),

  getAgentHistory: (limit = 10) =>
    apiFetch<{ runs: AgentRun[] }>(`/api/agent/history?limit=${limit}`),
};

