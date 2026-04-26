"use client";
import { useEffect, useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  ON_TRACK:  "bg-green-500/10 text-green-400 border-green-500/20",
  AT_RISK:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  OFF_TRACK: "bg-red-500/10 text-red-400 border-red-500/20",
};
const RISK_STYLE: Record<string, string> = {
  HIGH:   "bg-red-500/10 text-red-400 border border-red-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  LOW:    "bg-green-500/10 text-green-400 border border-green-500/20",
};

function StatusBadge({ value }: { value?: string }) {
  const safeValue = value || "UNKNOWN";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[safeValue] ?? "bg-[#222] text-gray-400 border-[#333]"}`}>
      {safeValue.replace("_", " ")}
    </span>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`vercel-card p-6 ${className}`}>
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-5 pb-3 border-b border-[#222]">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-3 flex flex-col justify-center">
      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
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
      <div className="flex items-center gap-3 mb-6 bg-[#111] border border-[#222] p-4 rounded-xl">
        <span className="text-3xl">{STATUS_ICON[data.overall_status] ?? "❓"}</span>
        <div>
          <div className="text-xl font-bold text-white mb-1">Overall Status</div>
          <StatusBadge value={data.overall_status} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {(data.panels ?? []).map((p: any) => (
          <div key={p.id} className="bg-[#111] border border-[#222] rounded-xl p-3 flex flex-col items-center text-center justify-center">
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2 text-balance leading-tight h-6 flex items-end">{p.title}</div>
            <div className={`text-sm font-bold ${
              p.type === "status"
                ? STATUS_STYLE[p.value]?.split(" ")[1] ?? "text-gray-300"
                : p.type === "risk"
                ? RISK_STYLE[p.value]?.split(" ")[1] ?? "text-gray-300"
                : "text-white"
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

  if (loading) return <Panel title="GitHub Agent"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data?.pr_metrics) return <Panel title="GitHub Agent"><p className="text-xs text-gray-400">Set GITHUB_TOKEN + GITHUB_REPO to enable.</p></Panel>;

  const m = data.pr_metrics;
  const totalCommits = data.commit_activity?.total_commits || 0;

  return (
    <Panel title="GitHub Agent">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Stat label="Total PRs" value={m.total_prs ?? "—"} sub={`${m.open_prs} open · ${m.closed_prs} closed`} />
        <Stat label="Avg Cycle" value={m.avg_cycle_hours ? `${m.avg_cycle_hours}h` : "—"} sub="review to merge" />
        <Stat label="Avg Comments" value={m.avg_comments ?? "—"} sub="per PR" />
        <Stat label="Quick Merges" value={data.quick_merges ?? "—"} sub="< 2h cycle" />
        <Stat label="Large PRs" value={data.large_prs ?? "—"} sub="> 10 comments" />
        <Stat label="Total Commits" value={totalCommits > 0 ? totalCommits : "—"} sub="Last 30 days" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.top_contributors?.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Top Contributors</div>
            <div className="space-y-2">
              {data.top_contributors.slice(0, 5).map((c: any) => (
                <div key={c.author} className="flex items-center justify-between text-xs bg-[#111] border border-[#222] p-2.5 rounded-lg hover:border-[#333] transition-colors">
                  <span className="font-mono text-gray-300">@{c.author}</span>
                  <span className="text-gray-400 font-bold bg-[#222] px-2 py-0.5 rounded">{c.prs} PRs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recent_prs?.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Recent PRs</div>
            <div className="space-y-2">
              {data.recent_prs.slice(0, 5).map((pr: any, i: number) => (
                <div key={i} className="flex flex-col text-xs bg-[#111] border border-[#222] p-2.5 rounded-lg hover:border-[#333] transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-gray-200 font-medium truncate pr-2" title={pr.title}>{pr.title || "Untitled PR"}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${pr.state === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {pr.state.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span className="font-mono bg-[#222] px-1.5 py-0.5 rounded">@{pr.author}</span>
                    {pr.cycle_hours && <span>{pr.cycle_hours}h cycle</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

  if (loading) return <Panel title="HR Intelligence"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data?.configured) return <Panel title="HR Intelligence"><p className="text-xs text-gray-400">Set GITHUB_TOKEN + GITHUB_REPO to enable.</p></Panel>;

  const risk  = data.team_burnout_risk ?? {};
  const score = risk.score ?? 0;
  const level = risk.level ?? "LOW";

  return (
    <Panel title="HR Intelligence">
      <div className="mb-6 bg-[#111] border border-[#222] p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-bold text-white">Team Burnout Risk</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Aggregated from PR timing, weekend commits, and overall volume</p>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${RISK_STYLE[level]}`}>{level}</span>
        </div>
        <div className="h-2 bg-[#222] rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full transition-all ${level === "HIGH" ? "bg-red-500" : level === "MEDIUM" ? "bg-yellow-500" : "bg-green-500"}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-400 mt-2 font-mono">{score}/100 Risk Score</div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="After-Hours" value={`${data.after_hours_pct}%`} sub="Commits outside 9-5" />
        <Stat label="Weekends" value={`${data.weekend_work_pct}%`} sub="Weekend commits" />
        <Stat label="Commits/day" value={data.commits_per_day} sub="Per developer avg" />
      </div>

      {data.team_breakdown?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Developer Breakdown</div>
          <div className="space-y-2">
            {data.team_breakdown.map((d: any) => (
              <div key={d.author} className="flex items-center justify-between bg-[#111] border border-[#222] p-3 rounded-xl hover:border-[#333] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-200">@{d.author}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-[#222] rounded-full overflow-hidden hidden sm:block">
                    <div className={`h-full rounded-full ${d.burnout.level === "HIGH" ? "bg-red-500" : d.burnout.level === "MEDIUM" ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${d.burnout.score}%` }} />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${RISK_STYLE[d.burnout.level]}`}>{d.burnout.level}</span>
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

  if (loading) return <Panel title="Finance Intelligence"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data) return null;

  return (
    <Panel title="Finance Intelligence">
      <div className="flex items-center justify-between mb-6 bg-[#111] border border-[#222] p-5 rounded-xl">
        <div>
          <span className="text-sm font-bold text-white block">Budget Health</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Cost efficiency vs throughput</p>
        </div>
        <StatusBadge value={data.budget_health} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Eng Cost (30d)" value={`$${(data.total_cost_usd ?? 0).toLocaleString()}`} sub="Estimated engineering run rate" />
        <Stat label="Sprint Cost" value={`$${(data.sprint_cost_usd ?? 0).toLocaleString()}`} sub="Active sprint run rate" />
        <Stat label="ROI Score" value={data.roi_score ?? "—"} sub="PRs per $10k spent" />
        <Stat label="Cost per PR" value={data.cost_per_pr_usd ? `$${data.cost_per_pr_usd.toLocaleString()}` : "—"} sub="Average output cost" />
      </div>

      {data.risk_radar?.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Risk Radar</div>
          <div className="space-y-2">
            {data.risk_radar.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#222] p-3 rounded-xl">
                <span className={`mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${r.severity === "high" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                  {r.severity.toUpperCase()}
                </span>
                <span className="text-xs text-gray-300 leading-relaxed">{r.desc}</span>
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

  if (loading) return <Panel title="PM Intelligence"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data?.configured) return <Panel title="PM Intelligence"><p className="text-xs text-gray-400">Set JIRA_* env vars to enable.</p></Panel>;
  if (!data?.sprint_name) return <Panel title="PM Intelligence"><p className="text-xs text-gray-400">No active sprint found.</p></Panel>;

  const conf  = data.delivery_confidence ?? {};
  const score = conf.score ?? 0;
  
  const total = data.total_issues || 1;
  const donePct = ((data.done || 0) / total) * 100;
  const ipPct = ((data.in_progress || 0) / total) * 100;

  return (
    <Panel title="PM Intelligence">
      <div className="mb-6 bg-[#111] border border-[#222] p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-white font-bold text-base">{data.sprint_name}</h4>
            {data.sprint_goal && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{data.sprint_goal}</p>}
          </div>
          <StatusBadge value={conf.status} />
        </div>
        
        <div className="flex justify-between text-[10px] text-gray-400 mb-2 uppercase font-semibold tracking-wider">
          <span>Sprint Progress</span>
          <span>{data.done} / {data.total_issues} done</span>
        </div>
        <div className="h-2.5 bg-[#222] rounded-full overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: `${donePct}%` }} />
          <div className="h-full bg-blue-500" style={{ width: `${ipPct}%` }} />
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Done ({data.done})</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> In Progress ({data.in_progress})</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#333]"></div> To Do ({data.todo})</div>
        </div>
        
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#222]">
          <span className="text-xs text-gray-400">Delivery Confidence Score</span>
          <span className="text-sm font-bold text-white bg-[#222] px-3 py-1 rounded-lg">{score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Scope Added" value={data.scope_added ?? 0} sub={`${data.scope_creep_pct}% creep`} />
        <Stat label="Blocked" value={data.blocked_issues ?? 0} sub="issues" />
        <Stat label="PR Velocity" value={data.pr_velocity?.closed ?? 0} sub={`${data.pr_velocity?.open ?? 0} open`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.risks?.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Risks & Warnings</div>
            <div className="space-y-2">
              {data.risks.map((r: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-[#111] border border-[#222] p-3 rounded-xl hover:border-[#333] transition-colors">
                  <span className={`mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${r.severity === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                    {r.type.replace("_", " ")}
                  </span>
                  <span className="text-gray-300 leading-relaxed">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.pending_issues?.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Pending Issues</div>
            <div className="space-y-2">
              {data.pending_issues.slice(0, 5).map((issue: any, i: number) => (
                <div key={i} className="flex flex-col text-xs bg-[#111] border border-[#222] p-3 rounded-xl hover:border-[#333] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-200 font-medium truncate pr-2" title={issue.summary}>{issue.summary || "Untitled"}</span>
                    <span className="text-[9px] font-mono text-gray-400 bg-[#222] px-1.5 py-0.5 rounded shrink-0">{issue.key}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${issue.status === 'Done' ? 'bg-green-500/10 text-green-400' : 'bg-[#222] text-gray-400'}`}>{issue.status}</span>
                    {issue.assignee && <span className="text-gray-500 flex items-center gap-1.5">👤 {issue.assignee}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ── dbt Cloud Panel ───────────────────────────────────────────────────────────
export function DBTPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/dbt`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="dbt Cloud"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data?.configured) return (
    <Panel title="dbt Cloud">
      <p className="text-xs text-gray-400">Set DBT_CLOUD_TOKEN + DBT_ACCOUNT_ID to enable.</p>
    </Panel>
  );

  const latest = data.latest_run ?? {};
  const statusColor: Record<string, string> = {
    Success:   "bg-green-500/10 text-green-400 border border-green-500/20",
    Error:     "bg-red-500/10 text-red-400 border border-red-500/20",
    Running:   "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Cancelled: "bg-[#222] text-gray-400 border border-[#333]",
  };

  return (
    <Panel title="dbt Cloud">
      <div className="flex items-center justify-between mb-6 bg-[#111] border border-[#222] p-5 rounded-xl">
        <div>
          <span className="text-sm font-bold text-white block mb-1">Pipeline Health</span>
          <span className="text-[10px] text-gray-400">{data.success_pct}% success rate</span>
        </div>
        <StatusBadge value={data.health} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Total Runs" value={data.total_runs ?? "—"} sub={`${data.success} success · ${data.failed} failed`} />
        <Stat label="Avg Duration" value={data.avg_duration_s ? `${Math.round(data.avg_duration_s)}s` : "—"} sub="per run" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Pipeline Executions</div>
          
          {latest.status && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Latest Run</div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-200 truncate pr-2">{latest.job_name || "Job"}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor[latest.status] ?? "bg-[#222] text-gray-400 border-[#333]"}`}>
                  {latest.status}
                </span>
              </div>
              {latest.duration_s && (
                <div className="text-[10px] text-gray-500 font-mono">Duration: {Math.round(latest.duration_s)}s</div>
              )}
            </div>
          )}

          {data.recent_runs?.length > 0 && (
            <div className="space-y-2">
              {data.recent_runs.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-xs bg-[#111] border border-[#222] p-2.5 rounded-lg hover:border-[#333] transition-colors">
                  <span className="text-gray-300 truncate max-w-[140px] font-medium">{r.job}</span>
                  <div className="flex items-center gap-3">
                    {r.duration_s && <span className="text-[10px] text-gray-500">{Math.round(r.duration_s)}s</span>}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColor[r.status] ?? "bg-[#222] text-gray-400 border-[#333]"}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.test_failures?.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Test Failures ({data.test_failures.length})
            </div>
            <div className="space-y-2">
              {data.test_failures.slice(0, 5).map((f: any, i: number) => (
                <div key={i} className="flex flex-col gap-1.5 text-xs bg-[#111] border border-red-500/20 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 bg-red-500/10 text-red-400 border border-red-500/20">
                      {f.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-300 font-mono text-[10px] break-all">{f.test}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ── Sentry Panel ──────────────────────────────────────────────────────────────
export function SentryPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/api/intelligence/sentry`)
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel title="Sentry"><div className="h-32 animate-pulse bg-[#111] border border-[#222] rounded-xl" /></Panel>;
  if (!data?.configured) return (
    <Panel title="Sentry">
      <p className="text-xs text-gray-400">Set SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT to enable.</p>
    </Panel>
  );

  const trendColor = data.error_trend === "spiking" ? "text-red-500" : data.error_trend === "declining" ? "text-green-500" : "text-gray-400";
  const trendIcon  = data.error_trend === "spiking" ? "↑" : data.error_trend === "declining" ? "↓" : "→";

  return (
    <Panel title="Sentry">
      <div className="flex items-center justify-between mb-6 bg-[#111] border border-[#222] p-5 rounded-xl">
        <div>
          <span className="text-sm font-bold text-white block mb-1">System Stability</span>
          <span className={`text-[10px] font-semibold ${trendColor} bg-[#222] px-2 py-0.5 rounded`}>
            {trendIcon} {data.error_trend.toUpperCase()}
            {data.volume_delta_pct !== 0 && ` (${data.volume_delta_pct > 0 ? "+" : ""}${data.volume_delta_pct}%)`}
          </span>
        </div>
        <StatusBadge value={data.health} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Unresolved" value={data.total_unresolved ?? "—"} sub="Total open issues" />
        <Stat label="Critical" value={data.critical ?? "—"} sub="P0/P1 issues" />
        <Stat label="Data-related" value={data.data_related ?? "—"} sub="Impacting pipelines" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.data_related > 0 && (
          <div className="md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Data Pipeline Exceptions Detected</div>
            </div>
            <p className="text-xs text-amber-400/80 leading-relaxed ml-7">{data.correlation_note}</p>
          </div>
        )}

        {data.top_issues?.length > 0 && (
          <div className="md:col-span-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Top Error Clusters</div>
            <div className="space-y-2">
              {data.top_issues.slice(0, 6).map((issue: any) => (
                <div key={issue.id} className="flex items-start gap-3 bg-[#111] border border-[#222] p-3.5 rounded-xl hover:border-[#333] transition-colors">
                  <span className={`mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                    issue.level === "fatal" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    issue.level === "error" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}>
                    {issue.level.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-medium truncate mb-1" title={issue.title}>{issue.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 bg-[#222] px-1.5 py-0.5 rounded">{issue.count} events</span>
                      {issue.data_related && (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">DATA PIPELINE</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
