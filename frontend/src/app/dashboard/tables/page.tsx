"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { name: "Overview", href: "/dashboard" },
  { name: "Tables", href: "/dashboard/tables" },
  { name: "Incidents", href: "/dashboard" }, // TODO
  { name: "Governance", href: "/dashboard" }, // TODO
  { name: "Lineage", href: "/dashboard/lineage" },
];

export default function TablesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedFqn, setSelectedFqn] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<any | null>(null);
  const [qualityTests, setQualityTests] = useState<any[]>([]);

  // Simple debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/data/search?q=${query}`);
        const data = await res.json();
        setResults(data.hits?.hits || []);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch details when a table is selected
  useEffect(() => {
    if (!selectedFqn) {
      setTableDetails(null);
      setQualityTests([]);
      return;
    }
    async function fetchDetails() {
      try {
        const [tableRes, qualityRes] = await Promise.all([
          fetch(`http://localhost:8000/api/data/table?fqn=${selectedFqn}`),
          fetch(`http://localhost:8000/api/data/quality?fqn=${selectedFqn}`).catch(() => null)
        ]);
        
        if (tableRes.ok) {
          setTableDetails(await tableRes.json());
        }
        if (qualityRes?.ok) {
          const qData = await qualityRes.json();
          setQualityTests(qData.data || []);
        } else {
          setQualityTests([]);
        }
      } catch (e) {
        console.error("Failed to fetch table details", e);
      }
    }
    fetchDetails();
  }, [selectedFqn]);

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
              key={link.name}
              href={link.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                link.name === "Tables"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <Link
            href="/dashboard/intelligence"
            className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Intelligence
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 ml-1">A</div>
        </nav>
      </div>

      {/* ── Page header ── */}
      <div className="max-w-[1400px] mx-auto px-5 pt-24 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Table Explorer</h1>
        <p className="text-sm text-gray-400 mt-1">
          Search data assets, view schemas, and inspect data quality directly from OpenMetadata.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 pb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Search & Results */}
        <div className="col-span-1 space-y-4">
          <input
            type="text"
            placeholder="Search tables (e.g. raw_customers)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          />
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-sm">
                {query.length < 2 ? "Type to search..." : "No results found."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {results.map((r: any) => {
                  const src = r._source;
                  const isSelected = selectedFqn === src.fullyQualifiedName;
                  return (
                    <button
                      key={src.fullyQualifiedName}
                      onClick={() => setSelectedFqn(src.fullyQualifiedName)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${isSelected ? 'bg-gray-50 border-l-4 border-gray-900' : 'border-l-4 border-transparent'}`}
                    >
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{src.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{src.fullyQualifiedName}</div>
                      </div>
                      {src.tier && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {src.tier}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Table Details */}
        <div className="col-span-2">
          {tableDetails ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{tableDetails.name}</h2>
                  <Link href={`/dashboard/lineage?fqn=${encodeURIComponent(tableDetails.fullyQualifiedName)}`} className="text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                    View Lineage →
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mb-4">{tableDetails.description || "No description provided."}</p>
                
                <div className="flex flex-wrap gap-2">
                  {tableDetails.tags?.map((tag: any) => (
                    <span key={tag.tagFQN} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">
                      {tag.tagFQN}
                    </span>
                  ))}
                  {tableDetails.owner && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100">
                      Owner: {tableDetails.owner.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Data Quality Section */}
              {qualityTests.length > 0 && (
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Data Quality Tests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qualityTests.map((t: any) => {
                      const isPassing = t.testCaseResult?.testCaseStatus === "Success";
                      return (
                        <div key={t.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isPassing ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Columns Section */}
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Columns</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableDetails.columns?.map((col: any) => (
                        <tr key={col.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{col.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{col.dataTypeDisplay || col.dataType}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{col.description || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {col.tags?.map((t: any) => (
                                <span key={t.tagFQN} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                  {t.tagFQN}
                                </span>
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Select a Table</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-sm">
                Search for a table on the left and select it to view its schema, lineage, and data quality tests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
