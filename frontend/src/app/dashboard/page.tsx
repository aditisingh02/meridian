"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import EventTicker from "@/components/EventTicker";
import HealthMap from "@/components/HealthMap";
import { api, type Stats, type Incident } from "@/lib/api";

const NAV_LINKS = ["Overview", "Tables", "Incidents", "Governance", "Lineage"];

const severityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  warning:  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  low:      "bg-[#222] text-gray-500",
};

const typeColor: Record<string, string> = {
  pii_detected:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  schema_change: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  entity_updated:"bg-[#222] text-gray-500",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, incRes] = await Promise.all([
        api.getStats(),
        api.getIncidents("open"),
      ]);
      setStats(statsRes);
      setIncidents(incRes.incidents);
    } catch {
      // Backend may not be ready — silently retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveIncident(id);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      // Refresh stats
      const s = await api.getStats();
      setStats(s);
    } catch (e) {
      console.error("Failed to resolve incident", e);
    }
  };

  const STAT_CARDS = stats
    ? [
        { label: "Open Incidents",   value: String(stats.open_incidents),  sub: `${stats.critical_incidents} critical`,       red: stats.open_incidents > 0 },
        { label: "PII Detections",   value: String(stats.pii_detections),  sub: "Governance alerts",                          red: stats.pii_detections > 0 },
        { label: "Schema Changes",   value: String(stats.schema_changes),  sub: "PR impact events",                           red: false },
        { label: "Total Events",     value: String(stats.total_events),    sub: "Since last restart",                         red: false },
      ]
    : null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#0a0a0a] border border-[#222]/30">

      {/* ── Floating pill navbar ── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 glass-nav rounded-full px-2 py-2 shadow-xl shadow-black/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="font-semibold text-white text-sm">Meridian</span>
          </Link>
          <div className="w-px h-4 bg-[#333] mx-1" />
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              onClick={() => setActiveNav(link)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeNav === link ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {link}
            </button>
          ))}
          <div className="w-px h-4 bg-[#333] mx-1" />
          <Link
            href="/dashboard/intelligence"
            className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Intelligence
          </Link>
          <div className="w-px h-4 bg-[#333] mx-1" />
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            stats && stats.open_incidents > 0
              ? "text-red-400 bg-red-500/10"
              : "text-green-400 bg-green-500/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${stats && stats.open_incidents > 0 ? "bg-red-500" : "bg-green-500"}`} />
            {stats && stats.open_incidents > 0 ? `${stats.open_incidents} Incident${stats.open_incidents > 1 ? "s" : ""}` : "Healthy"}
          </div>
          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 ml-1">A</div>
        </nav>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 p-5 pt-24 max-w-[1400px] mx-auto">

        {/* ── Left ── */}
        <div className="space-y-5">

          {/* Hero card */}
          <div className="vercel-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h1 className="text-2xl font-bold text-white">Estate Health Overview</h1>
              </div>
              <span className="text-xs bg-black border border-[#333] text-gray-400 px-3 py-1.5 rounded-lg font-medium">
                Auto-refreshes every 30s
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-6 ml-7">
              Real-time quality status across all monitored data assets and pipelines
            </p>

            {/* Stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {loading || !STAT_CARDS ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4 animate-pulse">
                    <div className="h-3 bg-[#333] rounded w-2/3 mb-2" />
                    <div className="h-7 bg-[#333] rounded w-1/2 mb-1" />
                    <div className="h-2.5 bg-[#222] rounded w-3/4" />
                  </div>
                ))
              ) : (
                STAT_CARDS.map((s) => (
                  <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-4">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.red ? "text-red-500" : "text-white"}`}>{s.value}</div>
                    <div className="text-[11px] mt-1 text-gray-400 font-medium">{s.sub}</div>
                  </div>
                ))
              )}
            </div>

            <HealthMap />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Open incidents */}
            <div className="vercel-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Open Incidents</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Click resolve to close</p>
                </div>
                <span className="text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg">
                  {incidents.length} open
                </span>
              </div>
              {incidents.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <span className="text-3xl mb-2">✅</span>
                  <span className="text-sm">No open incidents</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="border border-[#222] rounded-xl p-3 hover:border-[#333] transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${severityColor[inc.severity]}`}>
                          {inc.severity.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white leading-snug">{inc.title}</div>
                          {inc.table_fqn && (
                            <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">{inc.table_fqn}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400">{timeAgo(inc.created_at)}{inc.owner ? ` · @${inc.owner}` : ""}</span>
                        <button
                          onClick={() => handleResolve(inc.id)}
                          className="text-[10px] font-semibold text-gray-500 hover:text-white border border-[#333] hover:border-gray-400 px-2 py-0.5 rounded-md transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integrations */}
            <div className="vercel-card rounded-2xl p-5 shadow-sm flex flex-col justify-between text-white">
              <div>
                <div className="text-2xl mb-3">🔗</div>
                <h3 className="text-lg font-bold mb-2">Integrations</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  All three data pipelines are active and routing events to the dashboard and Slack.
                </p>
              </div>
              <div className="mt-6 space-y-2">
                {[
                  { name: "OpenMetadata", desc: "Webhook connected",      connected: true  },
                  { name: "GitHub",       desc: "PR impact watcher",       connected: true  },
                  { name: "Slack",        desc: "Bot + Socket Mode",        connected: !!process.env.NEXT_PUBLIC_SLACK_CONNECTED },
                  { name: "Groq AI",      desc: "llama-3.1-8b-instant",    connected: true  },
                ].map((int) => (
                  <div key={int.name} className="flex items-center justify-between bg-[#111] border border-[#222] rounded-xl px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-white">{int.name}</div>
                      <div className="text-[10px] text-gray-400">{int.desc}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${int.connected ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-black border border-[#333] text-gray-400"}`}>
                      {int.connected ? "Active" : "Set up →"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="space-y-5">
          <EventTicker />
        </div>
      </div>
    </div>
  );
}
