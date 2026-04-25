"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const EVENT_TYPES = [
  { type: "pii_detected",  message: "PII tag found in customers table",        time: "just now" },
  { type: "schema_change", message: "PR #42: Drop user_email from orders",      time: "2m ago"   },
  { type: "test_failure",  message: "Freshness check failed on payments",       time: "5m ago"   },
  { type: "schema_change", message: "PR #39: Add phone_number column",          time: "11m ago"  },
  { type: "pii_detected",  message: "PII tag found in billing_addresses",       time: "18m ago"  },
];

const TYPE_META: Record<string, { label: string; dot: string }> = {
  pii_detected:  { label: "PII",     dot: "bg-amber-400" },
  schema_change: { label: "Schema",  dot: "bg-blue-400"  },
  test_failure:  { label: "Failure", dot: "bg-red-400"   },
};

const FEATURES = [
  {
    icon: "🔍",
    title: "Data Quality Monitoring",
    description: "Continuous freshness, row count, and schema checks across all your data assets. Get alerted the moment something breaks.",
  },
  {
    icon: "🛡️",
    title: "PII & Governance Detection",
    description: "Automatically detect PII tags on tables and trigger Slack alerts. Enforce masking policies before data leaves your warehouse.",
  },
  {
    icon: "🔗",
    title: "GitHub PR Impact Analysis",
    description: "When a PR touches schema-breaking changes (drops, deletes, renames), Meridian flags it in Slack before it merges.",
  },
  {
    icon: "⚡",
    title: "Real-time Event Stream",
    description: "WebSocket-powered live feed of every event across your estate. See PII detections, schema changes, and test failures as they happen.",
  },
  {
    icon: "🗺️",
    title: "Estate Health Heatmap",
    description: "Visual overview of all 1,200+ monitored assets. Instantly spot which tables are healthy, degraded, or critical.",
  },
  {
    icon: "🤖",
    title: "Slack Bot Integration",
    description: "Ask /meridian impact directly in Slack. Get lineage-aware answers about which pipelines and dashboards a change would break.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect OpenMetadata",
    desc: "Point Meridian at your OpenMetadata instance. We register a webhook to receive entity change events.",
  },
  {
    step: "02",
    title: "Add the GitHub Webhook",
    desc: "Add Meridian's endpoint to your GitHub org. We watch for PRs that touch schema-sensitive keywords.",
  },
  {
    step: "03",
    title: "Get Instant Alerts",
    desc: "PII detections, schema changes, and test failures flow into Slack and your real-time dashboard in seconds.",
  },
];

const INTEGRATIONS = [
  { name: "OpenMetadata", desc: "Entity change webhooks"    },
  { name: "GitHub",       desc: "PR schema impact analysis" },
  { name: "Slack",        desc: "Governance & incident alerts" },
  { name: "FastAPI",      desc: "Backend event processing"  },
  { name: "WebSockets",   desc: "Real-time event streaming" },
];

export default function HeroSection() {
  const [activeEvent, setActiveEvent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveEvent((p) => (p + 1) % EVENT_TYPES.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* ── Hero – video background ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        {/* White gradient fade: top transparent → bottom white */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/10 via-white/40 to-white pointer-events-none" />

        {/* Hero text – centered */}
        <div className="relative z-20 max-w-3xl mx-auto px-6 text-center pt-36 pb-36">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-widest uppercase border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
            Data Observability & Governance
          </div>

          <h1 className="tracking-tight leading-[1.1] text-gray-900 mb-6">
            <span className="block text-6xl md:text-7xl font-light">Know when your</span>
            <em className="block text-6xl md:text-7xl font-serif not-italic italic font-normal text-gray-600">
              data breaks.
            </em>
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-10">
            Meridian monitors your data estate in real time —{" "}
            <em className="font-serif italic font-normal">detecting PII exposure</em>,
            schema-breaking PRs, and quality failures before they reach production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/dashboard"
              className="bg-gray-900 text-white font-medium px-7 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Open Dashboard
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              See how it works →
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            Works with OpenMetadata · GitHub · Slack
          </p>
        </div>
      </section>

      {/* ── Live event feed (sits just below video, on white) ── */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm font-medium text-gray-700">Live Event Stream</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
                Connected
              </div>
            </div>
            <div className="space-y-2">
              {EVENT_TYPES.map((ev, i) => {
                const meta = TYPE_META[ev.type];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                      i === activeEvent ? "bg-white border-gray-200 shadow-sm" : "border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`}></span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-14 flex-shrink-0">
                      {meta.label}
                    </span>
                    <p className="text-sm text-gray-700 flex-1 truncate">{ev.message}</p>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{ev.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "1,204",     label: "Tables Monitored"  },
            { value: "< 2s",      label: "Alert Latency"     },
            { value: "3",         label: "Integrations"      },
            { value: "Real-time", label: "Event Streaming"   },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">How it works</h2>
            <p className="text-gray-500 mt-2">Set up in minutes, not days.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div className="text-xs font-mono text-gray-300 mb-3">{step.step}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">What Meridian does</h2>
            <p className="text-gray-500 mt-2">A unified observability layer for your entire data estate.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section id="integrations" className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Integrations</h2>
            <p className="text-gray-500 mt-2">Built on the tools your data team already uses.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {INTEGRATIONS.map((item) => (
              <div key={item.name} className="flex items-center gap-3 border border-gray-200 rounded-lg px-5 py-3 bg-white">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-white tracking-tight">Ready to explore?</h2>
          <p className="text-gray-400 mt-4 text-base leading-relaxed">
            Open the dashboard to see the live event stream, estate health heatmap, and real-time incident feed.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Open Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="font-medium text-gray-900">Meridian</div>
          <div>Intelligent Data Observability & Governance</div>
        </div>
      </footer>
    </>
  );
}
