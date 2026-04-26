const API_BASE = process.env.NEXT_PUBLIC_API_URL as string;

export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL as string) + "/ws/events";

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

export interface SearchHit {
  _source?: {
    name?: string;
    fullyQualifiedName?: string;
    tier?: string;
    description?: string;
  };
}

export interface SearchResponse {
  hits?: {
    hits?: SearchHit[];
  };
  error?: string;
}

export interface EntityRef {
  id: string;
  name?: string;
  fullyQualifiedName?: string;
}

export interface ColumnTag {
  tagFQN: string;
}

export interface TableColumn {
  name: string;
  dataType?: string;
  dataTypeDisplay?: string;
  description?: string;
  tags?: ColumnTag[];
}

export interface TableDetails {
  name: string;
  fullyQualifiedName: string;
  description?: string;
  tags?: ColumnTag[];
  owner?: {
    name?: string;
  };
  columns?: TableColumn[];
}

export interface QualityTest {
  id: string;
  name: string;
  description?: string;
  testCaseResult?: {
    testCaseStatus?: string;
  };
}

export interface QualityResponse {
  data?: QualityTest[];
}

export interface LineageEdge {
  fromEntity: string;
  toEntity: string;
}

export interface LineageResponse {
  entity?: EntityRef;
  nodes?: EntityRef[];
  upstreamEdges?: LineageEdge[];
  downstreamEdges?: LineageEdge[];
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

  getHealth: () => apiFetch<{ status: string; version: string; integrations: Record<string, boolean> }>("/health"),
  searchData: (query: string = "*") =>
    apiFetch<SearchResponse>(`/api/data/search?q=${encodeURIComponent(query)}`),
  getTable: (fqn: string) =>
    apiFetch<TableDetails>(`/api/data/table?fqn=${encodeURIComponent(fqn)}`),
  getLineage: (fqn: string) =>
    apiFetch<LineageResponse>(`/api/data/lineage?fqn=${encodeURIComponent(fqn)}`),
  getQuality: (fqn: string) =>
    apiFetch<QualityResponse>(`/api/data/quality?fqn=${encodeURIComponent(fqn)}`),
};

