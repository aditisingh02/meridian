"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, EntityRef, LineageEdge, SearchHit } from "@/lib/api";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

const NAV_LINKS = [
  { name: "Overview", href: "/dashboard" },
  { name: "Tables", href: "/dashboard/tables" },
  { name: "Lineage", href: "/dashboard/lineage" },
];

export default function LineagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading…</div>
    }>
      <LineageInner />
    </Suspense>
  );
}

function LineageInner() {
  const searchParams = useSearchParams();
  const initialFqn = searchParams.get("fqn") || "";

  const [query, setQuery] = useState(initialFqn);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLineage = useCallback(async (fqn: string) => {
    if (!fqn.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLineage(fqn);

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const entityMap = new Map<string, EntityRef>();

      if (data.entity) entityMap.set(data.entity.id, data.entity);
      if (data.nodes) data.nodes.forEach((n) => entityMap.set(n.id, n));

      let upY = 0, downY = 0;

      if (data.entity) {
        newNodes.push({
          id: data.entity.id,
          position: { x: 400, y: 300 },
          data: { label: data.entity.name || data.entity.fullyQualifiedName },
          style: { background: "#fff", color: "#000", border: "1px solid #444", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      if (data.upstreamEdges) {
        data.upstreamEdges.forEach((edge: LineageEdge, i: number) => {
          const fromNode = entityMap.get(edge.fromEntity);
          if (fromNode && !newNodes.find(n => n.id === fromNode.id)) {
            newNodes.push({
              id: fromNode.id,
              position: { x: 50, y: 150 + upY },
              data: { label: fromNode.name || fromNode.fullyQualifiedName },
              style: { background: "#111", color: "#ccc", border: "1px solid #333", borderRadius: "8px", padding: "10px", fontSize: "12px" },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });
            upY += 90;
          }
          newEdges.push({ id: `up-${i}`, source: edge.fromEntity, target: edge.toEntity, animated: true, style: { stroke: "#555" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#555" } });
        });
      }

      if (data.downstreamEdges) {
        data.downstreamEdges.forEach((edge: LineageEdge, i: number) => {
          const toNode = entityMap.get(edge.toEntity);
          if (toNode && !newNodes.find(n => n.id === toNode.id)) {
            newNodes.push({
              id: toNode.id,
              position: { x: 800, y: 150 + downY },
              data: { label: toNode.name || toNode.fullyQualifiedName },
              style: { background: "#111", color: "#ccc", border: "1px solid #333", borderRadius: "8px", padding: "10px", fontSize: "12px" },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });
            downY += 90;
          }
          newEdges.push({ id: `down-${i}`, source: edge.fromEntity, target: edge.toEntity, animated: true, style: { stroke: "#555" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#555" } });
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (e: unknown) {
      setNodes([]);
      setEdges([]);
      setError(e instanceof Error ? e.message : "Lineage not found or OpenMetadata is unreachable.");
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    const term = query.trim();
    const timer = setTimeout(async () => {
      if (term.length > 0 && term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        setLoadingSuggestions(true);
        const data = await api.searchData(term || "*");
        setSuggestions((data.hits?.hits || []).slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!initialFqn) return;
    const timer = setTimeout(() => {
      fetchLineage(initialFqn);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialFqn, fetchLineage]);

  const resolveFqnAndFetch = useCallback(async (input: string) => {
    const candidate = input.trim();
    if (!candidate) return;

    const directMatch = suggestions.find((hit) => hit._source?.fullyQualifiedName === candidate);
    if (directMatch?._source?.fullyQualifiedName) {
      fetchLineage(directMatch._source.fullyQualifiedName);
      return;
    }

    if (candidate.includes(".")) {
      fetchLineage(candidate);
      return;
    }

    try {
      const data = await api.searchData(candidate);
      const firstFqn = data.hits?.hits?.[0]?._source?.fullyQualifiedName;
      if (firstFqn) {
        setQuery(firstFqn);
        fetchLineage(firstFqn);
        return;
      }
      setError(`No table found for "${candidate}".`);
    } catch {
      setError("Unable to search for that table right now.");
    }
  }, [fetchLineage, suggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    resolveFqnAndFetch(query);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
      {/* Navbar */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-[#333] rounded-full px-2 py-2 shadow-xl shadow-black/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0">
            <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="font-semibold text-white text-sm">Meridian</span>
          </Link>
          <div className="w-px h-4 bg-[#333] mx-1" />
          {NAV_LINKS.map((link) => (
            <Link key={link.name} href={link.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                link.name === "Lineage"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >{link.name}</Link>
          ))}
          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 ml-1">A</div>
        </nav>
      </div>

      {/* Header + Search */}
      <div className="max-w-[1400px] w-full mx-auto px-5 pt-24 pb-4">
        <h1 className="text-2xl font-bold text-white">Lineage Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">Visually trace upstream and downstream dependencies for any data asset.</p>
        <form onSubmit={handleSearch} className="mt-6 max-w-2xl">
          <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by table name or FQN (e.g. raw_customers)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#111] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition font-mono text-sm"
          />
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {loading ? "Loading…" : "Trace"}
          </button>
          </div>
          <div className="mt-2 min-h-7 text-xs text-gray-500">
            {loadingSuggestions ? (
              <span>Searching tables...</span>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((hit) => {
                  const fqn = hit._source?.fullyQualifiedName;
                  if (!fqn) return null;
                  return (
                    <button
                      key={fqn}
                      type="button"
                      onClick={() => {
                        setQuery(fqn);
                        fetchLineage(fqn);
                      }}
                      className="rounded-full border border-[#333] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition"
                    >
                      {hit._source?.name || fqn}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span>Tip: click a suggested table to trace lineage instantly.</span>
            )}
          </div>
        </form>
      </div>

      {/* Graph */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-5 pb-10">
        <div className="w-full h-[600px] bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden relative">
          {error && (
            <div className="absolute top-4 left-4 z-10 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 text-sm font-medium">
              {error}
            </div>
          )}
          {nodes.length === 0 && !loading && !error && (
            <div className="flex w-full h-full items-center justify-center text-gray-600 text-sm">
              Search for a table above to visualize its lineage graph.
            </div>
          )}
          {(nodes.length > 0 || loading) && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-right"
              style={{ background: "#0a0a0a" }}
            >
              <Background color="#1a1a1a" gap={20} />
              <Controls style={{ background: "#111", border: "1px solid #333", borderRadius: "8px" }} />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
