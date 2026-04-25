import EventTicker from '@/components/EventTicker';
import HealthMap from '@/components/HealthMap';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-white text-gray-900 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-8 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Meridian <span className="font-light text-gray-500">Mission Control</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Intelligent Data Observability & Governance</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full text-xs font-semibold tracking-wide flex items-center shadow-sm">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
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
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className="text-gray-500 text-xs font-semibold mb-2 tracking-wider uppercase">Monitored Tables</div>
                <div className="text-3xl font-bold text-gray-900">1,204</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className="text-gray-500 text-xs font-semibold mb-2 tracking-wider uppercase">Active Incidents</div>
                <div className="text-3xl font-bold text-gray-900">2</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className="text-gray-500 text-xs font-semibold mb-2 tracking-wider uppercase">Pending Governance</div>
                <div className="text-3xl font-bold text-gray-900">5</div>
              </div>
            </div>

            {/* Health Map Component */}
            <HealthMap />
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
