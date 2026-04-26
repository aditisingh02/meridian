"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ExecutivePanel,
  GitHubPanel,
  HRPanel,
  FinancePanel,
  PMPanel,
  DBTPanel,
  SentryPanel,
} from "@/components/intelligence/IntelligencePanels";

const NAV_LINKS = ["Overview", "Tables", "Incidents", "Governance", "Lineage"];
const TABS = ["Executive", "GitHub", "HR", "Finance", "PM", "dbt", "Sentry"] as const;
type Tab = (typeof TABS)[number];

export default function IntelligencePage() {
  const [tab, setTab] = useState<Tab>("Executive");

  return (
    <div className="min-h-screen bg-[#f0f1f5]">

      {/* ── Floating pill navbar ── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-full px-2 py-2 shadow-sm shadow-black/5">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[9px] font-bold">M</span>
            <span className="font-semibold text-gray-900 text-sm">Meridian</span>
          </Link>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          {NAV_LINKS.map((link) => (
            <Link
              key={link}
              href="/dashboard"
              className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {link}
            </Link>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <Link
            href="/dashboard/intelligence"
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-900 text-white"
          >
            Intelligence
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 ml-1">A</div>
        </nav>
      </div>

      {/* ── Page header ── */}
      <div className="max-w-[1400px] mx-auto px-5 pt-24 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Intelligence Hub</h1>
            <p className="text-sm text-gray-400 mt-1">
              Cross-domain signals across GitHub, HR, Finance, and PM
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-[1400px] mx-auto px-5 pb-10">
        {tab === "Executive" && (
          <div className="space-y-5">
            <ExecutivePanel />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <GitHubPanel />
              <HRPanel />
              <FinancePanel />
              <PMPanel />
            </div>
          </div>
        )}
        {tab === "GitHub"  && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><GitHubPanel /></div>}
        {tab === "HR"      && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><HRPanel /></div>}
        {tab === "Finance" && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><FinancePanel /></div>}
        {tab === "PM"      && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><PMPanel /></div>}
        {tab === "dbt"     && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><DBTPanel /></div>}
        {tab === "Sentry"  && <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><SentryPanel /></div>}
      </div>
    </div>
  );
}
