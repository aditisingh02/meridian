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
    <div className="bg-white border border-gray-200 rounded-xl p-6 h-[440px] relative flex flex-col overflow-hidden shadow-sm">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            Estate Health Heatmap
          </h3>
          <p className="text-sm text-gray-500 mt-1">Real-time status of 150 monitored assets</p>
        </div>
        <div className="flex space-x-3 text-xs font-medium text-gray-500">
          <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2"></span>Healthy</div>
          <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2"></span>Warning</div>
          <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>Critical</div>
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
                aspect-square rounded-[4px] transition-all duration-200 cursor-pointer relative
                ${asset.status === 'healthy' ? 'bg-green-50 border border-green-100 hover:bg-green-100' : ''}
                ${asset.status === 'warning' ? 'bg-yellow-50 border border-yellow-100 hover:bg-yellow-100' : ''}
                ${asset.status === 'error' ? 'bg-red-50 border border-red-100 hover:bg-red-100' : ''}
                ${hoveredAsset === asset.id ? 'scale-110 z-20 shadow-sm' : 'scale-100 z-10'}
              `}
            >
              {/* Tooltip */}
              {hoveredAsset === asset.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-xl w-max pointer-events-none z-50">
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
    </div>
  );
}
