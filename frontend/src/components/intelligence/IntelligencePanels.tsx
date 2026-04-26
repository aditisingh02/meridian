"use client";
import { useEffect, useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  ON_TRACK:  "bg-green-100 text-green-700 border-green-200",
  AT_RISK:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  OFF_TRACK: "bg-red-100 text-red-600 border-red-200",
};
const RISK_STYLE: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW:    "bg-green-100 text-green-700",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[value] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {value.replace("_", " ")}
    </span>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm ${className}`}>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-gray-900 mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Executive Panel ──────────────────────────────────────────────────────────
export function ExecutivePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/executive/dashboard`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="Executive Dashboard"><div className="h-40 flex items-center justify-center text-gray-300 animate-pulse text-sm">Loading…</div></Panel>;
  if (!data) return null;

  const STATUS_ICON: Record<string, string> = { ON_TRACK: "✅", AT_RISK: "⚠️", OFF_TRACK: "🔴" };

  return (
    <Panel title="Executive Dashboard" className="col-span-full">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{STATUS_ICON[data.overall_status] ?? "❓"}</span>
        <div>
          <div className="text-lg font-bold text-gray-900">Overall Status</div>
          <StatusBadge value={data.overall_status} />
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
        {(data.panels ?? []).map((p: any) => (
          <div key={p.id} className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{p.title}</div>
            <div className={`text-sm font-bold ${
              p.type === "status"
                ? STATUS_STYLE[p.value]?.split(" ")[1] ?? "text-gray-700"
                : p.type === "risk"
                ? RISK_STYLE[p.value]?.split(" ")[1] ?? "text-gray-700"
                : "text-gray-900"
            }`}>
              {String(p.value).replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── GitHub Panel ─────────────────────────────────────────────────────────────
export function GitHubPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/github?days=30`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="GitHub Agent"><div className="h-32 animate-pulse bg-gray-50 rounded-xl" /></Panel>;
  if (!data?.pr_metrics) return <Panel title="GitHub Agent"><p className="text-xs text-gray-400">Set GITHUB_TOKEN + GITHUB_REPO to enable.</p></Panel>;

  const m = data.pr_metrics;
  return (
    <Panel title="GitHub Agent">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Total PRs" value={m.total_prs ?? "—"} sub={`${m.open_prs} open · ${m.closed_prs} closed`} />
        <Stat label="Avg Cycle" value={m.avg_cycle_hours ? `${m.avg_cycle_hours}h` : "—"} sub="review to merge" />
        <Stat label="Avg Comments" value={m.avg_comments ?? "—"} sub="per PR" />
        <Stat label="Quick Merges" value={data.quick_merges ?? "—"} sub="< 2h cycle" />
      </div>
      {data.top_contributors?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Top Contributors</div>
          <div className="space-y-1">
            {data.top_contributors.slice(0, 5).map((c: any) => (
              <div key={c.author} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-700">@{c.author}</span>
                <span className="text-gray-400">{c.prs} PRs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── HR Panel ─────────────────────────────────────────────────────────────────
export function HRPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/hr?days=30`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="HR Intelligence"><div className="h-32 animate-pulse bg-gray-50 rounded-xl" /></Panel>;
  if (!data?.configured) return <Panel title="HR Intelligence"><p className="text-xs text-gray-400">Set GITHUB_TOKEN + GITHUB_REPO to enable.</p></Panel>;

  const risk  = data.team_burnout_risk ?? {};
  const score = risk.score ?? 0;
  const level = risk.level ?? "LOW";

  return (
    <Panel title="HR Intelligence">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Team Burnout Risk</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_STYLE[level]}`}>{level}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${level === "HIGH" ? "bg-red-400" : level === "MEDIUM" ? "bg-yellow-400" : "bg-green-400"}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{score}/100</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="After-Hours" value={`${data.after_hours_pct}%`} />
        <Stat label="Weekends" value={`${data.weekend_work_pct}%`} />
        <Stat label="Commits/day" value={data.commits_per_day} />
      </div>
      {data.team_breakdown?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Developer Breakdown</div>
          <div className="space-y-2">
            {data.team_breakdown.slice(0, 4).map((d: any) => (
              <div key={d.author} className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-700">@{d.author}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.burnout.level === "HIGH" ? "bg-red-400" : d.burnout.level === "MEDIUM" ? "bg-yellow-400" : "bg-green-400"}`}
                      style={{ width: `${d.burnout.score}%` }} />
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${RISK_STYLE[d.burnout.level]}`}>{d.burnout.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Finance Panel ─────────────────────────────────────────────────────────────
export function FinancePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/finance?days=30`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="Finance Intelligence"><div className="h-32 animate-pulse bg-gray-50 rounded-xl" /></Panel>;
  if (!data) return null;

  return (
    <Panel title="Finance Intelligence">
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge value={data.budget_health} />
        <span className="text-xs text-gray-400">Budget Health</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Eng Cost (30d)" value={`$${(data.total_cost_usd ?? 0).toLocaleString()}`} />
        <Stat label="Sprint Cost" value={`$${(data.sprint_cost_usd ?? 0).toLocaleString()}`} />
        <Stat label="ROI Score" value={data.roi_score ?? "—"} sub="PRs per $10k" />
        <Stat label="Cost per PR" value={data.cost_per_pr_usd ? `$${data.cost_per_pr_usd.toLocaleString()}` : "—"} />
      </div>
      {data.risk_radar?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Risk Radar</div>
          <div className="space-y-1.5">
            {data.risk_radar.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${r.severity === "high" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.severity.toUpperCase()}
                </span>
                <span className="text-gray-600">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── PM Panel ─────────────────────────────────────────────────────────────────
export function PMPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/pm?days=14`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="PM Intelligence"><div className="h-32 animate-pulse bg-gray-50 rounded-xl" /></Panel>;
  if (!data?.configured) return <Panel title="PM Intelligence"><p className="text-xs text-gray-400">Set JIRA_* env vars to enable.</p></Panel>;
  if (!data?.sprint_name) return <Panel title="PM Intelligence"><p className="text-xs text-gray-400">No active sprint found.</p></Panel>;

  const conf  = data.delivery_confidence ?? {};
  const score = conf.score ?? 0;

  return (
    <Panel title="PM Intelligence">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Delivery Confidence · <span className="font-mono">{data.sprint_name}</span></span>
          <StatusBadge value={conf.status} />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${conf.status === "ON_TRACK" ? "bg-green-400" : conf.status === "AT_RISK" ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ width: `${score}%` }} />
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{score}/100 confidence</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Done" value={data.done ?? 0} sub={`of ${data.total_issues}`} />
        <Stat label="Scope Added" value={data.scope_added ?? 0} sub={`${data.scope_creep_pct}% creep`} />
        <Stat label="Blocked" value={data.blocked_issues ?? 0} sub="issues" />
      </div>
      {data.risks?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Risks</div>
          <div className="space-y-1.5">
            {data.risks.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${r.severity === "high" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.type}
                </span>
                <span className="text-gray-600">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
