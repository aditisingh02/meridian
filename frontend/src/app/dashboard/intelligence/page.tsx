"use client";

import Link from "next/link";
import { Globe, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { ExecutivePanel, GitHubPanel, HRPanel, FinancePanel, PMPanel, DBTPanel, SentryPanel } from "@/components/intelligence/IntelligencePanels";

import Navbar from "@/components/Navbar";

const INTELLIGENCE_TABS = [
  { id: "executive", name: "Executive" },
  { id: "github", name: "GitHub" },
  { id: "hr", name: "HR" },
  { id: "finance", name: "Finance" },
  { id: "pm", name: "PM" },
  { id: "dbt", name: "dbt" },
  { id: "sentry", name: "Sentry" },
];

function GroqInsight({ tabId }: { tabId: string }) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const API = process.env.NEXT_PUBLIC_API_URL as string;
    
    fetch(`${API}/api/intelligence/${tabId}/insight`)
      .then(r => r.json())
      .then(data => {
        setInsight(data.insight);
      })
      .catch((e) => {
        console.error(e);
        setInsight("Failed to load AI insights. Please ensure the backend is running and GROQ_API_KEY is configured.");
      })
      .finally(() => setLoading(false));
  }, [tabId]);

  const tabName = INTELLIGENCE_TABS.find(t => t.id === tabId)?.name || "Data";

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-6 h-fit">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#222]">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-bold text-white">Meridian Insights</h3>
        <span className="ml-auto text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
          Llama 3 70B
        </span>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-[#222] rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-[#222] rounded w-full animate-pulse" />
          <div className="h-4 bg-[#222] rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-[#222] rounded w-4/6 animate-pulse" />
        </div>
      ) : (
        <div className="text-sm text-gray-300 leading-relaxed space-y-4">
          <p>
            Based on the latest signals from <strong>{tabName}</strong>:
          </p>
          <div className="text-gray-400">
            {insight}
          </div>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-[#222]">
            AI-generated insights are based on cross-domain data correlation.
          </p>
        </div>
      )}
    </div>
  );
}

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState("executive");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#0a0a0a] border border-[#222]/30">

      <Navbar />

      {/* ── Body ── */}
      <div className="p-5 pt-28 max-w-[1400px] mx-auto">
        
        {/* Header with Tab Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Intelligence Hub</h1>
            <p className="text-gray-400 text-sm">Cross-domain signals across GitHub, HR, Finance, and PM</p>
          </div>

          {/* Tab Toggles (like the image) */}
          <div className="flex bg-[#0a0a0a] border border-[#222] rounded-full p-1 overflow-x-auto hide-scrollbar">
            {INTELLIGENCE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#1a1a1a] text-white border border-[#333] shadow-sm"
                    : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="mt-8">
          {activeTab === "executive" ? (
            <div className="space-y-6">
              <ExecutivePanel />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GitHubPanel />
                <HRPanel />
                <FinancePanel />
                <PMPanel />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
              <div className="min-h-[500px]">
                {activeTab === "github" && <GitHubPanel />}
                {activeTab === "hr" && <HRPanel />}
                {activeTab === "finance" && <FinancePanel />}
                {activeTab === "pm" && <PMPanel />}
                {activeTab === "dbt" && <DBTPanel />}
                {activeTab === "sentry" && <SentryPanel />}
              </div>
              
              {/* Groq AI Insight Panel */}
              <div className="sticky top-28 h-fit">
                <GroqInsight tabId={activeTab} />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}