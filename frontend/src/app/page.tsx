"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { TargetCursor } from "@/components/ui/TargetCursor";
import { LogoLoop } from "@/components/ui/LogoLoop";

// Lazy-load the heavy Three.js Beams to avoid SSR issues
const Beams = dynamic(() => import("@/components/ui/Beams"), { ssr: false });

// ── Fade-in-up wrapper ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  return (
    <FadeUp delay={delay}>
      <div className="group relative border border-[#222] rounded-2xl p-6 hover:border-[#555] transition-all duration-300 bg-black/40 backdrop-blur-sm hover:bg-[#0a0a0a]">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </FadeUp>
  );
}

// ── Animated Pipeline Diagram ─────────────────────────────────────────────────
const PIPELINE_NODES = [
  { id: "sources", label: "Data Sources", sub: "GitHub · Jira · Slack", x: 60, y: 200, color: "#6366f1" },
  { id: "om", label: "OpenMetadata", sub: "Catalog · Lineage · DQ", x: 320, y: 120, color: "#8b5cf6" },
  { id: "dbt", label: "dbt Cloud", sub: "Transforms · Tests", x: 320, y: 280, color: "#f59e0b" },
  { id: "meridian", label: "Meridian", sub: "Intelligence Hub", x: 580, y: 200, color: "#ffffff", isCenter: true },
  { id: "sentry", label: "Sentry", sub: "Error Tracking", x: 840, y: 120, color: "#e879f9" },
  { id: "pagerduty", label: "PagerDuty", sub: "On-call · Alerts", x: 840, y: 280, color: "#f97316" },
];

const PIPELINE_EDGES = [
  { from: "sources", to: "om" },
  { from: "sources", to: "dbt" },
  { from: "om", to: "meridian" },
  { from: "dbt", to: "meridian" },
  { from: "meridian", to: "sentry" },
  { from: "meridian", to: "pagerduty" },
];

function PipelineDiagram() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveEdge((prev) => (prev + 1) % PIPELINE_EDGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [inView]);

  const nodeMap = Object.fromEntries(PIPELINE_NODES.map((n) => [n.id, n]));
  const W = 1040, H = 420;

  return (
    <div ref={ref} className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-4xl mx-auto" style={{ minWidth: 600 }}>
        {/* Edges */}
        {PIPELINE_EDGES.map((edge, i) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          const x1 = from.x + 80, y1 = from.y + 32;
          const x2 = to.x, y2 = to.y + 32;
          const mx = (x1 + x2) / 2;
          const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
          const isActive = activeEdge === i;
          return (
            <g key={i}>
              <path d={path} fill="none" stroke="#222" strokeWidth={2} />
              <motion.path
                d={path}
                fill="none"
                stroke={from.color}
                strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? {
                  pathLength: isActive ? [0, 1] : [0, 0],
                  opacity: isActive ? [0, 1, 1, 0] : 0,
                } : {}}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              {/* Moving dot */}
              {isActive && inView && (
                <motion.circle
                  r={4}
                  fill={from.color}
                  initial={{ offsetDistance: "0%" } as any}
                  animate={{ offsetDistance: "100%" } as any}
                  style={{ offsetPath: `path("${path}")` } as any}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {PIPELINE_NODES.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={160}
              height={64}
              rx={12}
              fill={node.isCenter ? "#ffffff" : "#0f0f0f"}
              stroke={node.color}
              strokeWidth={node.isCenter ? 0 : 1.5}
            />
            <text
              x={node.x + 80}
              y={node.y + 24}
              textAnchor="middle"
              fill={node.isCenter ? "#000" : "#fff"}
              fontSize={13}
              fontWeight={700}
              fontFamily="var(--font-geist-sans)"
            >
              {node.label}
            </text>
            <text
              x={node.x + 80}
              y={node.y + 44}
              textAnchor="middle"
              fill={node.isCenter ? "#666" : "#555"}
              fontSize={10}
              fontFamily="var(--font-geist-sans)"
            >
              {node.sub}
            </text>
            {/* Color dot */}
            {!node.isCenter && (
              <circle cx={node.x + 18} cy={node.y + 32} r={4} fill={node.color} />
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── OpenMetadata section scrolling flow ────────────────────────────────────────
const OM_STEPS = [
  { icon: "🗂️", title: "Catalog", desc: "Automatically ingests and catalogs all your data assets — tables, dashboards, pipelines, and more." },
  { icon: "🔗", title: "Lineage", desc: "Traces every upstream and downstream dependency so you can see the full impact of any schema change." },
  { icon: "✅", title: "Data Quality", desc: "Runs configurable test suites and surfaces failures directly in the Meridian Intelligence Hub." },
  { icon: "🏷️", title: "Governance", desc: "Tags PII columns, assigns owners, and tracks SLA tiers across your entire data estate." },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-black text-white selection:bg-white/20 relative">
<TargetCursor className="" />

      {/* ── Fixed Three.js Beams — full viewport ── */}
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none z-0 overflow-hidden">
        <Beams
          beamWidth={3}
          beamHeight={30}
          beamNumber={15}
          lightColor="#ffffff"
          speed={1.5}
          noiseIntensity={1.5}
          scale={0.18}
          rotation={20}
        />
        {/* Fade out to black at the bottom of the hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black pointer-events-none" />
      </div>

      {/* ── Floating pill navbar ── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 glass-nav rounded-full px-2 py-2 shadow-xl shadow-black/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="font-semibold text-white text-sm">Meridian</span>
          </Link>
          <div className="hidden md:block w-px h-4 bg-[#333] mx-1" />
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Features</a>
            <a href="#openmetadata" className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">OpenMetadata</a>
            <a href="#integrations" className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Integrations</a>
            <a href="#pipeline" className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">How it Works</a>
          </div>
          <div className="w-px h-4 bg-[#333] mx-1" />
          <Link
            href="/dashboard"
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Open Dashboard →
          </Link>
        </nav>
      </div>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] max-w-5xl mx-auto pb-3"
          style={{ background: "linear-gradient(to bottom, #ffffff 40%, #555 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          The Intelligence Hub<br />for Data Teams.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 mt-8 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Monitor incidents, trace data lineage, track pipeline health, and correlate cross-domain signals — all from a single, beautifully unified platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white text-black rounded-xl font-semibold text-base hover:scale-105 transition-transform shadow-xl shadow-white/10"
          >
            Open Dashboard
          </Link>
          <a
            href="https://github.com/aditisingh02/meridian"
            className="px-8 py-4 border border-[#333] text-white rounded-xl font-semibold text-base hover:bg-[#111] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View on GitHub
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 text-xs"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >↓</motion.div>
          <span>Scroll to explore</span>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 border-y border-[#1a1a1a] py-16 px-6">
        <FadeUp>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatItem value="7+" label="Integrations live" />
            <StatItem value="<2s" label="Alert latency" />
            <StatItem value="100%" label="Dark mode" />
            <StatItem value="∞" label="Observability depth" />
          </div>
        </FadeUp>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="pipeline" className="relative z-10 py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Architecture</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">How Meridian Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
              Meridian sits at the center of your data stack, pulling signals from every tool and surfacing a single, unified picture of health.
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <PipelineDiagram />
          </FadeUp>
          <FadeUp delay={0.3} className="mt-10 text-center text-sm text-gray-600">
            Data flows from sources → cataloged in OpenMetadata → transformed by dbt → monitored by Meridian → incidents escalated via Sentry & PagerDuty
          </FadeUp>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-28 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Intelligence Hub</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Everything in one place.</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Seven integrated panels giving you a complete picture of engineering, data, and operations health.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard delay={0.0} icon="📟" title="PagerDuty Alerting" desc="Critical data incidents automatically trigger on-call pages. Auto-resolve when the issue clears, with full audit trails." />
            <FeatureCard delay={0.05} icon="🐛" title="Sentry Error Tracking" desc="Correlate application errors with data pipeline failures. Identify data-related errors automatically using keyword analysis." />
            <FeatureCard delay={0.10} icon="🧱" title="dbt Cloud Pipelines" desc="Monitor job success rates, average durations, and test failures. Know the moment a transformation breaks before it cascades." />
            <FeatureCard delay={0.15} icon="🐙" title="GitHub Intelligence" desc="PR cycle time, contributor burnout risk, after-hours commit patterns, and team-level velocity metrics — all automatic." />
            <FeatureCard delay={0.20} icon="📋" title="Jira / PM Signals" desc="Sprint health, ticket velocity, and blocker tracking. Correlate delayed sprints with pipeline outages automatically." />
            <FeatureCard delay={0.25} icon="💬" title="Slack Integration" desc="Real-time incident notifications sent directly to your team Slack channel with context, severity, and resolution links." />
            <FeatureCard delay={0.30} icon="👥" title="HR & Burnout Risk" desc="Weekend commits, after-hours activity, and per-developer burn scores — surfaced before someone burns out." />
            <FeatureCard delay={0.35} icon="💰" title="Finance Intelligence" desc="Sprint cost estimation, incident cost modelling, and engineering ROI tracking based on team size and hourly rates." />
            <FeatureCard delay={0.40} icon="⚡" title="Executive Dashboard" desc="A single status signal synthesising all domains. Green, amber, or red — instantly shareable with stakeholders." />
          </div>
        </div>
      </section>

      {/* ── OPENMETADATA ── */}
      <section id="openmetadata" className="relative z-10 py-28 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">OpenMetadata</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">Your Data Catalog, Built In.</h2>
              <p className="text-gray-400 text-base leading-relaxed mb-8">
                Meridian deeply integrates with OpenMetadata to bring catalog, lineage, and data quality directly into the dashboard — no tab-switching, no context loss.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/tables" className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Table Explorer
                </Link>
                <Link href="/dashboard/lineage" className="px-5 py-2.5 border border-[#333] text-white rounded-lg text-sm font-semibold hover:bg-[#111] transition-colors">
                  Lineage Graph
                </Link>
              </div>
            </FadeUp>

            <div className="space-y-4">
              {OM_STEPS.map((step, i) => (
                <FadeUp key={step.title} delay={i * 0.1}>
                  <div className="flex items-start gap-4 p-5 border border-[#222] rounded-xl hover:border-[#444] transition-colors bg-black/40">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{step.icon}</div>
                    <div>
                      <div className="font-semibold text-white text-sm mb-1">{step.title}</div>
                      <div className="text-sm text-gray-500 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS LOGOS ── */}
      <section id="integrations" className="relative z-10 py-20 border-t border-[#1a1a1a] overflow-hidden">
        <FadeUp className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">Integrates with your entire stack</p>
        </FadeUp>
        <LogoLoop
          speed={35}
          gap={120}
          items={[
            {
              name: "OpenMetadata",
              logo: <img src="/logos/1.png" alt="OpenMetadata logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "dbt Cloud",
              logo: <img src="/logos/2.png" alt="dbt Cloud logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "Sentry",
              logo: <img src="/logos/3.png" alt="Sentry logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "PagerDuty",
              logo: <img src="/logos/4.png" alt="PagerDuty logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "GitHub",
              logo: <img src="/logos/5.png" alt="GitHub logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "Jira",
              logo: <img src="/logos/6.png" alt="Jira logo" width={140} height={140} className="object-contain" />,
            },
            {
              name: "Slack",
              logo: <img src="/logos/7.png" alt="Slack logo" width={140} height={140} className="object-contain" />,
            },
          ]}
        />
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-32 px-6 border-t border-[#1a1a1a]">
        {/* Subtle centered glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-white/3 rounded-full blur-3xl" />
        </div>
        <FadeUp className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Ready to get full<br />observability?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Your complete intelligence hub is already live. Open the dashboard and start connecting your stack.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex px-10 py-5 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-white/10"
          >
            Open Dashboard →
          </Link>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#111] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Globe className="w-3 h-3 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-gray-400">Meridian</span>
            <span>— Built for data teams</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/tables" className="hover:text-white transition-colors">Tables</Link>
            <Link href="/dashboard/lineage" className="hover:text-white transition-colors">Lineage</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
