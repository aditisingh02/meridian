"use client";

import { useEffect, useRef, useState } from "react";
import { api, WS_URL, type MeridianEvent } from "@/lib/api";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const RECONNECT_DELAY_MS = 3000;

const TYPE_LABELS: Record<string, { label: string; dot: string }> = {
  pii_detected:   { label: "PII",     dot: "bg-amber-400" },
  schema_change:  { label: "Schema",  dot: "bg-blue-400"  },
  entity_updated: { label: "Updated", dot: "bg-gray-300"  },
  test_failure:   { label: "Failure", dot: "bg-red-400"   },
};

const fallback = { label: "Event", dot: "bg-gray-300" };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function EventTicker() {
  const [events, setEvents] = useState<MeridianEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  // Pre-populate from REST API on mount
  useEffect(() => {
    api.getEvents(20).then(({ events: recent }) => {
      setEvents(recent);
    }).catch(() => {
      // Backend not ready yet — WebSocket will populate when events arrive
    });
  }, []);

  // WebSocket live stream
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
          const data = JSON.parse(event.data) as MeridianEvent;
          setEvents((prev) => [data, ...prev].slice(0, 50));
        } catch {
          // Silently ignore malformed messages
        }
      };

      ws.onerror = () => {
        // Browser gives no detail — onclose handles reconnect
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus("disconnected");
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
    <div className="bg-white rounded-2xl p-5 flex flex-col h-[560px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Live Event Stream
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusDot[status]}`} />
          {statusLabel[status]}
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 italic">
            {status === "connected" ? "Waiting for events…" : "Connecting to stream…"}
          </div>
        ) : (
          events.map((evt) => {
            const meta = TYPE_LABELS[evt.type] ?? fallback;
            return (
              <div
                key={evt.id}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">
                      {formatTime(evt.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-snug">{evt.message}</p>
                  {evt.table_fqn && (
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                      {evt.table_fqn}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
