"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { name: "Overview", href: "/dashboard" },
  { name: "Tables", href: "/dashboard/tables" },
  { name: "Incidents", href: "/dashboard" },
  { name: "Governance", href: "/dashboard" },
  { name: "Lineage", href: "/dashboard/lineage" },
];

export default function TablesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedFqn, setSelectedFqn] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<any | null>(null);
  const [qualityTests, setQualityTests] = useState<any[]>([]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/data/search?q=${query}`);
        const data = await res.json();
        setResults(data.hits?.hits || []);
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!selectedFqn) { setTableDetails(null); setQualityTests([]); return; }
    async function fetchDetails() {
      try {
        const [tableRes, qualityRes] = await Promise.all([
          fetch(`http://localhost:8000/api/data/table?fqn=${selectedFqn}`),
          fetch(`http://localhost:8000/api/data/quality?fqn=${selectedFqn}`).catch(() => null)
        ]);
        if (tableRes.ok) setTableDetails(await tableRes.json());
        if (qualityRes?.ok) {
          const qData = await qualityRes.json();
          setQualityTests(qData.data || []);
        } else setQualityTests([]);
      } catch (e) { console.error("Failed to fetch table details", e); }
    }
    fetchDetails();
  }, [selectedFqn]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Navbar */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-[#333] rounded-full px-2 py-2 shadow-xl shadow-black/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="font-semibold text-white text-sm">Meridian</span>
          </Link>
          <div className="w-px h-4 bg-[#333] mx-1" />
          {NAV_LINKS.map((link) => (
            <Link key={link.name} href={link.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                link.name === "Tables"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >{link.name}</Link>
          ))}
          <div className="w-px h-4 bg-[#333] mx-1" />
          <Link href="/dashboard/intelligence"
            className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >Intelligence</Link>
          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 ml-1">A</div>
        </nav>
      </div>

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-5 pt-24 pb-4">
        <h1 className="text-2xl font-bold text-white">Table Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">Search data assets, view schemas, and inspect data quality directly from OpenMetadata.</p>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 pb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Search */}
        <div className="col-span-1 space-y-4">
          <input
            type="text"
            placeholder="Search tables (e.g. raw_customers)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#333] bg-[#111] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
          />
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden flex flex-col min-h-[500px]">
            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-600 text-sm">
                {query.length < 2 ? "Type to search…" : "No results found."}
              </div>
            ) : (
              <div className="divide-y divide-[#222] max-h-[600px] overflow-y-auto">
                {results.map((r: any) => {
                  const src = r._source;
                  const isSelected = selectedFqn === src.fullyQualifiedName;
                  return (
                    <button key={src.fullyQualifiedName} onClick={() => setSelectedFqn(src.fullyQualifiedName)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#111] transition-colors flex items-center justify-between border-l-4 ${isSelected ? "bg-[#111] border-white" : "border-transparent"}`}
                    >
                      <div>
                        <div className="font-semibold text-white text-sm">{src.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5 truncate">{src.fullyQualifiedName}</div>
                      </div>
                      {src.tier && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#222] text-gray-400">{src.tier}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="col-span-2">
          {tableDetails ? (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">{tableDetails.name}</h2>
                  <Link href={`/dashboard/lineage?fqn=${encodeURIComponent(tableDetails.fullyQualifiedName)}`}
                    className="text-xs font-medium bg-[#222] text-gray-300 hover:bg-[#333] px-3 py-1.5 rounded-full transition-colors"
                  >View Lineage →</Link>
                </div>
                <p className="text-sm text-gray-500 mb-4">{tableDetails.description || "No description provided."}</p>
                <div className="flex flex-wrap gap-2">
                  {tableDetails.tags?.map((tag: any) => (
                    <span key={tag.tagFQN} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag.tagFQN}</span>
                  ))}
                  {tableDetails.owner && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Owner: {tableDetails.owner.name}</span>
                  )}
                </div>
              </div>

              {qualityTests.length > 0 && (
                <div className="p-6 border-b border-[#222] bg-[#111]/50">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Data Quality Tests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qualityTests.map((t: any) => {
                      const isPassing = t.testCaseResult?.testCaseStatus === "Success";
                      return (
                        <div key={t.id} className="bg-[#0a0a0a] p-3 rounded-lg border border-[#333] flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isPassing ? "bg-green-500" : "bg-red-500"}`} />
                          <div>
                            <div className="text-sm font-semibold text-white">{t.name}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Columns</h3>
                <div className="border border-[#222] rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-[#222]">
                    <thead className="bg-[#111]">
                      <tr>
                        {["Name", "Type", "Description", "Tags"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {tableDetails.columns?.map((col: any) => (
                        <tr key={col.name} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{col.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{col.dataTypeDisplay || col.dataType}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{col.description || "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {col.tags?.map((t: any) => (
                                <span key={t.tagFQN} className="text-[9px] px-1.5 py-0.5 rounded bg-[#222] text-gray-400 font-medium">{t.tagFQN}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-4 border border-[#333]">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-white">Select a Table</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">Search for a table on the left to view its schema, lineage, and data quality tests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
