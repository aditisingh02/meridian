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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden h-[600px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center tracking-wide uppercase">
        <span className="relative flex h-2 w-2 mr-3">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live Event Stream
      </h2>
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {events.map((evt) => (
          <div key={evt.id} className="animate-fade-in bg-white rounded-lg p-4 border border-gray-100 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-semibold px-2 py-1 rounded tracking-widest uppercase border border-gray-200 text-gray-500">
                {evt.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{evt.message}</p>
          </div>
        ))}
        {events.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
            Connecting to OpenMetadata...
          </div>
        )}
      </div>
    </div>
  );
}
