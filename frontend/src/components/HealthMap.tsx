"use client";

import { useState, useEffect } from "react";

const generateMockAssets = () => {
  const assets = [];
  for (let i = 0; i < 150; i++) {
    const rand = Math.random();
    let status = "healthy";
    if (rand > 0.85 && rand <= 0.95) status = "warning";
    if (rand > 0.95) status = "error";
    assets.push({ id: `asset-${i}`, name: `data_asset_${i}`, status });
  }
  return assets;
};

export default function HealthMap() {
  const [assets, setAssets] = useState<{ id: string; name: string; status: string }[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setAssets(generateMockAssets());
    const interval = setInterval(() => {
      setAssets((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const r = Math.random();
        next[idx] = { ...next[idx], status: r > 0.8 ? (r > 0.9 ? "error" : "warning") : "healthy" };
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const healthy = assets.filter((a) => a.status === "healthy").length;
  const warning = assets.filter((a) => a.status === "warning").length;
  const error   = assets.filter((a) => a.status === "error").length;

  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-700">Estate Heatmap</div>
          <div className="text-xs text-gray-400 mt-0.5">150 assets · updates every 2.5s</div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-green-200 inline-block border border-green-300" />
            {healthy} healthy
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-yellow-200 inline-block border border-yellow-300" />
            {warning} warning
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-200 inline-block border border-red-300" />
            {error} critical
          </div>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(25, minmax(0, 1fr))" }}
      >
        {assets.map((asset) => (
          <div
            key={asset.id}
            onMouseEnter={() => setHovered(asset.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              aspect-square rounded-[3px] cursor-pointer transition-colors duration-500 relative
              ${asset.status === "healthy" ? "bg-green-200 hover:bg-green-300"  : ""}
              ${asset.status === "warning" ? "bg-yellow-200 hover:bg-yellow-300" : ""}
              ${asset.status === "error"   ? "bg-red-200 hover:bg-red-300"      : ""}
            `}
          >
            {hovered === asset.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-lg w-max pointer-events-none z-50">
                <div className="font-mono">{asset.name}</div>
                <div className={`capitalize mt-0.5 ${asset.status === "healthy" ? "text-green-400" : asset.status === "warning" ? "text-yellow-400" : "text-red-400"}`}>
                  {asset.status}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
