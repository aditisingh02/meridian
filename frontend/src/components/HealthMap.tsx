"use client";

import { useState, useEffect } from "react";

// Mock data representing our data assets (tables, pipelines, etc.)
const generateMockAssets = () => {
  const assets = [];
  for (let i = 0; i < 150; i++) {
    // 85% healthy, 10% warning, 5% error
    const rand = Math.random();
    let status = "healthy";
    if (rand > 0.85 && rand <= 0.95) status = "warning";
    if (rand > 0.95) status = "error";
    
    assets.push({
      id: `asset-${i}`,
      name: `data_asset_${i}`,
      status,
      lastUpdated: new Date().toISOString()
    });
  }
  return assets;
};

export default function HealthMap() {
  const [assets, setAssets] = useState<{id: string, name: string, status: string}[]>([]);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  useEffect(() => {
    setAssets(generateMockAssets());
    
    // Simulate real-time health changes
    const interval = setInterval(() => {
      setAssets(prev => {
        const newAssets = [...prev];
        const idx = Math.floor(Math.random() * newAssets.length);
        const rand = Math.random();
        newAssets[idx].status = rand > 0.8 ? (rand > 0.9 ? 'error' : 'warning') : 'healthy';
        return newAssets;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 h-[440px] relative flex flex-col overflow-hidden group">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            Estate Health Heatmap
          </h3>
          <p className="text-sm text-gray-400 mt-1">Real-time status of 150 monitored assets</p>
        </div>
        <div className="flex space-x-3 text-xs font-semibold text-gray-400">
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Healthy</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Warning</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>Critical</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
          {assets.map((asset) => (
            <div 
              key={asset.id}
              onMouseEnter={() => setHoveredAsset(asset.id)}
              onMouseLeave={() => setHoveredAsset(null)}
              className={`
                aspect-square rounded-md transition-all duration-300 cursor-pointer relative
                ${asset.status === 'healthy' ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}
                ${asset.status === 'warning' ? 'bg-yellow-500/30 border border-yellow-500/50 hover:bg-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]' : ''}
                ${asset.status === 'error' ? 'bg-red-500/40 border border-red-500/60 hover:bg-red-500/60 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]' : ''}
                ${hoveredAsset === asset.id ? 'scale-125 z-20' : 'scale-100 z-10'}
              `}
            >
              {/* Tooltip */}
              {hoveredAsset === asset.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 backdrop-blur-md border border-white/10 text-white text-xs py-2 px-3 rounded-lg shadow-xl w-max pointer-events-none z-50">
                  <div className="font-mono font-bold mb-1">{asset.name}</div>
                  <div className={`capitalize ${asset.status === 'healthy' ? 'text-green-400' : asset.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                    Status: {asset.status}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.05)_0,rgba(0,0,0,0)_80%)] pointer-events-none"></div>
    </div>
  );
}
