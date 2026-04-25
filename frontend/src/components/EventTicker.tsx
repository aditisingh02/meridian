"use client";

import { useEffect, useRef, useState } from "react";

interface OMEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const WS_URL = "ws://localhost:8000/ws/events";
const RECONNECT_DELAY_MS = 3000;

export default function EventTicker() {
  const [events, setEvents] = useState<OMEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OMEvent;
          setEvents((prev) => [data, ...prev].slice(0, 15));
        } catch {
          // Silently ignore malformed messages
        }
      };

      ws.onerror = () => {
        // Browser intentionally gives no detail on WS errors for security.
        // onclose fires right after and handles reconnection.
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus("disconnected");
        // Reconnect after delay
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const statusDot: Record<ConnectionStatus, string> = {
    connecting:   "bg-yellow-400 animate-pulse",
    connected:    "bg-green-500",
    disconnected: "bg-red-400",
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    connecting:   "Connecting...",
    connected:    "Live",
    disconnected: "Reconnecting...",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
          Live Event Stream
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusDot[status]}`} />
          {statusLabel[status]}
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {events.map((evt) => (
          <div key={evt.id} className="animate-fade-in bg-white rounded-lg p-4 border border-gray-100 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-semibold px-2 py-1 rounded tracking-widest uppercase border border-gray-200 text-gray-500">
                {evt.type.replace(/_/g, " ")}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(evt.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{evt.message}</p>
          </div>
        ))}

        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 text-sm">
            {status === "connected" ? (
              <span>Waiting for events...</span>
            ) : (
              <span className="italic">Connecting to OpenMetadata...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
