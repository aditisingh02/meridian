"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoLoopProps {
  items: { name: string; logo: React.ReactNode }[];
  speed?: number; // seconds for one full loop
  className?: string;
  gap?: number; // px gap between items
}

export function LogoLoop({ items, speed = 30, className, gap = 48 }: LogoLoopProps) {
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-black to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-black to-transparent" />

      <div
        className="flex items-center"
        style={{
          animation: `logo-loop ${speed}s linear infinite`,
          gap: `${gap}px`,
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300 flex-shrink-0"
          >
            <span className="flex-shrink-0">{item.logo}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes logo-loop {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
