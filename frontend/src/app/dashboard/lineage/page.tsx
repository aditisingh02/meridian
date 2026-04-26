"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  { name: "Incidents", href: "/dashboard" },
  { name: "Governance", href: "/dashboard" },
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLineage = useCallback(async (fqn: string) => {
    if (!fqn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/data/lineage?fqn=${fqn}`);
      if (!res.ok) throw new Error("Lineage not found or OpenMetadata is unreachable.");
      const data = await res.json();

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const entityMap = new Map();

      if (data.entity) entityMap.set(data.entity.id, data.entity);
      if (data.nodes) data.nodes.forEach((n: any) => entityMap.set(n.id, n));

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
        data.upstreamEdges.forEach((edge: any, i: number) => {
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
        data.downstreamEdges.forEach((edge: any, i: number) => {
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (initialFqn) fetchLineage(initialFqn);
  }, [initialFqn, fetchLineage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLineage(query);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 flex flex-col">
      {/* Navbar */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-[#333] rounded-full px-2 py-2 shadow-xl shadow-black/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-[9px] font-bold">M</span>
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
          <div className="w-px h-4 bg-[#333] mx-1" />
          <Link href="/dashboard/intelligence"
            className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >Intelligence</Link>
          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 ml-1">A</div>
        </nav>
      </div>

      {/* Header + Search */}
      <div className="max-w-[1400px] w-full mx-auto px-5 pt-24 pb-4">
        <h1 className="text-2xl font-bold text-white">Lineage Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">Visually trace upstream and downstream dependencies for any data asset.</p>
        <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-2xl">
          <input
            type="text"
            placeholder="Enter full table FQN (e.g. sample_data.ecommerce_db.mysql.raw_customers)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-[#333] bg-[#111] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition font-mono text-sm"
          />
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {loading ? "Loading…" : "Trace"}
          </button>
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
