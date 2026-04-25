import EventTicker from '@/components/EventTicker';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-white p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-8 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Meridian <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Mission Control</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Intelligent Data Observability & Governance</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-bold tracking-wide flex items-center shadow-[0_0_20px_rgba(34,197,94,0.15)]">
               <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
               SYSTEM HEALTHY
             </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Dashboard Widgets */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat Cards */}
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="text-gray-400 text-sm font-semibold mb-2 group-hover:text-indigo-400 transition-colors tracking-wide uppercase">Monitored Tables</div>
                <div className="text-4xl font-black text-white">1,204</div>
              </div>
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-red-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                <div className="text-gray-400 text-sm font-semibold mb-2 group-hover:text-red-400 transition-colors tracking-wide uppercase">Active Incidents</div>
                <div className="text-4xl font-black text-red-400">2</div>
              </div>
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-yellow-500/30 transition-colors group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
                <div className="text-gray-400 text-sm font-semibold mb-2 group-hover:text-yellow-400 transition-colors tracking-wide uppercase">Pending Governance</div>
                <div className="text-4xl font-black text-yellow-400">5</div>
              </div>
            </div>

            {/* Heatmap / Assets Map Placeholder */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 h-[440px] relative flex flex-col items-center justify-center overflow-hidden group hover:border-white/10 transition-colors">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0,rgba(0,0,0,0)_70%)] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0,rgba(0,0,0,0)_70%)] transition-all duration-500"></div>
               
               <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                 <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
               </div>
               
               <h3 className="text-2xl font-bold text-white mb-2">Data Lineage & Health Map</h3>
               <p className="text-gray-400 max-w-md text-center leading-relaxed">Interactive visualization of your entire data estate. Connects directly to OpenMetadata to map out table dependencies and propagation of data quality failures.</p>
               
               <button className="mt-8 px-8 py-3 bg-white text-black hover:bg-gray-200 font-bold rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95">
                 Explore Lineage
               </button>
            </div>
          </div>

          {/* Right Column - Event Ticker */}
          <div className="lg:col-span-1">
            <EventTicker />
          </div>

        </div>
      </div>
    </main>
  );
}
