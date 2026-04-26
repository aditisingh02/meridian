"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
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
      if (!res.ok) {
        throw new Error("Lineage not found or OpenMetadata is unreachable.");
      }
      const data = await res.json();
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Create a map to quickly find node by ID
      const entityMap = new Map();
      if (data.entity) entityMap.set(data.entity.id, data.entity);
      if (data.nodes) {
        data.nodes.forEach((n: any) => entityMap.set(n.id, n));
      }

      // We'll do a very naive layout: upstream on left, center entity, downstream on right.
      // This is a simplified auto-layout.
      let upY = 0;
      let downY = 0;

      // Add center entity
      if (data.entity) {
        newNodes.push({
          id: data.entity.id,
          position: { x: 400, y: 300 },
          data: { label: data.entity.name || data.entity.fullyQualifiedName },
          style: { background: '#111827', color: 'white', border: '1px solid #374151', borderRadius: '8px', padding: '10px' },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Add Upstream Edges & Nodes
      if (data.upstreamEdges) {
        data.upstreamEdges.forEach((edge: any, i: number) => {
          const fromNode = entityMap.get(edge.fromEntity);
          if (fromNode && !newNodes.find(n => n.id === fromNode.id)) {
            newNodes.push({
              id: fromNode.id,
              position: { x: 50, y: 150 + upY },
              data: { label: fromNode.name || fromNode.fullyQualifiedName },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });
            upY += 80;
          }
          newEdges.push({
            id: `up-${i}`,
            source: edge.fromEntity,
            target: edge.toEntity,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      }

      // Add Downstream Edges & Nodes
      if (data.downstreamEdges) {
        data.downstreamEdges.forEach((edge: any, i: number) => {
          const toNode = entityMap.get(edge.toEntity);
          if (toNode && !newNodes.find(n => n.id === toNode.id)) {
            newNodes.push({
              id: toNode.id,
              position: { x: 800, y: 150 + downY },
              data: { label: toNode.name || toNode.fullyQualifiedName },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            });
            downY += 80;
          }
          newEdges.push({
            id: `down-${i}`,
            source: edge.fromEntity,
            target: edge.toEntity,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  // If a fqn is provided in the URL, load it automatically.
  useEffect(() => {
    if (initialFqn) {
      fetchLineage(initialFqn);
    }
  }, [initialFqn, fetchLineage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLineage(query);
  };

  return (
    <div className="min-h-screen bg-[#f0f1f5] flex flex-col">
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
                link.name === "Lineage"
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
      <div className="max-w-[1400px] w-full mx-auto px-5 pt-24 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Lineage Explorer</h1>
        <p className="text-sm text-gray-400 mt-1">
          Visually trace upstream and downstream dependencies for any data asset.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-2xl">
          <input
            type="text"
            placeholder="Enter full table name (e.g. sample_data.ecommerce_db.mysql.raw_customers)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          />
          <button type="submit" disabled={loading} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? "Loading..." : "Trace"}
          </button>
        </form>
      </div>

      {/* ── Graph ── */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-5 pb-10">
        <div className="w-full h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          {error && (
            <div className="absolute top-4 left-4 z-10 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium">
              {error}
            </div>
          )}
          {nodes.length === 0 && !loading && !error ? (
            <div className="flex w-full h-full items-center justify-center text-gray-400 text-sm">
              Search for a table to view its lineage graph.
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#f3f4f6" gap={16} />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
