"use client";

import Link from "next/link";
import { useState } from "react";
import EventTicker from "@/components/EventTicker";
import HealthMap from "@/components/HealthMap";

const STATS = [
  { label: "Monitored Tables",  value: "1,204", sub: "+12 this week",     up: true  },
  { label: "Checks Passed 24h", value: "98.2%", sub: "2,841 / 2,895",    up: true  },
  { label: "Active Incidents",  value: "2",     sub: "1 critical",        up: false },
  { label: "Governance Alerts", value: "5",     sub: "3 PII · 2 schema",  up: false },
];

const INCIDENTS = [
  { id: "INC-041", severity: "critical", title: "Freshness failure",         table: "analytics.dbt.fct_revenue",         owner: "data-eng",  age: "1h ago"  },
  { id: "INC-040", severity: "warning",  title: "Row count drift +12%",      table: "ecommerce_db.shopify.payments",     owner: "commerce",  age: "48m ago" },
  { id: "INC-039", severity: "warning",  title: "Stale data (>4h threshold)", table: "analytics.reporting.weekly_kpis",  owner: "analytics", age: "2h ago"  },
];

const GOVERNANCE = [
  { id: "GOV-021", type: "PII",    table: "customers.email",         action: "Enforce masking",      priority: "high"   },
  { id: "GOV-020", type: "PII",    table: "billing_addresses.phone", action: "Review access policy", priority: "high"   },
  { id: "GOV-019", type: "Schema", table: "orders.user_email",       action: "PR #42 review",        priority: "medium" },
  { id: "GOV-018", type: "Schema", table: "payments",                action: "Row drift alert",      priority: "medium" },
  { id: "GOV-017", type: "Lineage", table: "fct_revenue",            action: "Impact: 3 dashboards", priority: "low"    },
];

const NAV_LINKS = ["Overview", "Tables", "Incidents", "Governance", "Lineage"];

const severityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-600",
  warning:  "bg-yellow-100 text-yellow-700",
};

const priorityColor: Record<string, string> = {
  high:   "bg-red-100 text-red-600",
  medium: "bg-yellow-100 text-yellow-700",
  low:    "bg-gray-100 text-gray-500",
};

const typeColor: Record<string, string> = {
  PII:    "bg-amber-100 text-amber-700",
  Schema: "bg-blue-100 text-blue-700",
  Lineage:"bg-purple-100 text-purple-700",
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");

  return (
    <div className="min-h-screen bg-[#f0f1f5]">

      {/* ── Floating pill navbar ── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-full px-2 py-2 shadow-sm shadow-black/5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[9px] font-bold">M</span>
            <span className="font-semibold text-gray-900 text-sm">Meridian</span>
          </Link>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Nav links */}
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              onClick={() => setActiveNav(link)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeNav === link
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* Status + avatar */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Healthy
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 ml-1">
            A
          </div>
        </nav>
      </div>

      {/* ── Page body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 p-5 pt-24 max-w-[1400px] mx-auto">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Hero card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h2 className="text-2xl font-bold text-gray-900">Estate Health Overview</h2>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg font-medium">Live</span>
            </div>
            <p className="text-sm text-gray-400 mb-6 ml-7">
              Real-time quality status across all monitored data assets and pipelines
            </p>

            {/* Stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {STATS.map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${!s.up && s.value === "2" ? "text-red-500" : "text-gray-900"}`}>
                    {s.value}
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${s.up ? "text-green-600" : "text-gray-400"}`}>{s.sub}</div>
                </div>
              ))}
            </div>

            <HealthMap />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Governance queue */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Governance Queue</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Pending review & enforcement</p>
                </div>
                <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-lg">{GOVERNANCE.length} open</span>
              </div>
              <div className="space-y-2.5">
                {GOVERNANCE.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeColor[g.type]}`}>{g.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate font-mono">{g.table}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{g.action}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize flex-shrink-0 ${priorityColor[g.priority]}`}>
                      {g.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-gray-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-white">
              <div>
                <div className="text-2xl mb-3">🔗</div>
                <h3 className="text-lg font-bold mb-2">Connect Integrations</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Link OpenMetadata, GitHub, and Slack to unlock real-time PII detection, schema impact analysis, and automated alerts.
                </p>
              </div>
              <div className="mt-6 space-y-2">
                {[
                  { name: "OpenMetadata", connected: true  },
                  { name: "GitHub",       connected: true  },
                  { name: "Slack",        connected: false },
                ].map((int) => (
                  <div key={int.name} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-medium">{int.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${int.connected ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400"}`}>
                      {int.connected ? "Connected" : "Set up →"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Active incidents */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Active Incidents</h3>
              <button className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">See all</button>
            </div>
            <div className="space-y-3">
              {INCIDENTS.map((inc) => (
                <div key={inc.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${severityColor[inc.severity]}`}>
                      {inc.severity.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{inc.title}</div>
                      <div className="text-[11px] font-mono text-gray-400 mt-1 truncate">{inc.table}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400">
                    <span>@{inc.owner}</span>
                    <span>{inc.age}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live event ticker */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <EventTicker />
          </div>
        </div>
      </div>
    </div>
  );
}
