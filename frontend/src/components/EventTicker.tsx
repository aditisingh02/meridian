"use client";

import { useEffect, useState } from "react";

interface OMEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function EventTicker() {
  const [events, setEvents] = useState<OMEvent[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/events");
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [data, ...prev].slice(0, 15));
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden h-[600px] flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      <h2 className="text-lg font-bold text-white mb-5 flex items-center tracking-tight">
        <span className="relative flex h-2.5 w-2.5 mr-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        Live Event Stream
      </h2>
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {events.map((evt) => (
          <div key={evt.id} className="animate-fade-in bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase ${
                evt.type === 'test_failure' ? 'bg-red-500/20 text-red-400' :
                evt.type === 'pii_detected' ? 'bg-yellow-500/20 text-yellow-400' :
                evt.type === 'schema_change' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {evt.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">{evt.message}</p>
          </div>
        ))}
        {events.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
            Connecting to OpenMetadata...
          </div>
        )}
      </div>
    </div>
  );
}
