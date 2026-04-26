"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Deterministic beam definitions (no random, so SSR-safe)
const BEAMS = [
  // Horizontal beams
  { horiz: true,  pos: 15,  dur: 6,   del: 0,    color: "#6366f1" },
  { horiz: true,  pos: 35,  dur: 8,   del: 1.5,  color: "#8b5cf6" },
  { horiz: true,  pos: 55,  dur: 5,   del: 3,    color: "#3b82f6" },
  { horiz: true,  pos: 75,  dur: 9,   del: 0.8,  color: "#6366f1" },
  { horiz: true,  pos: 90,  dur: 7,   del: 4,    color: "#a855f7" },
  // Vertical beams
  { horiz: false, pos: 10,  dur: 7,   del: 0.3,  color: "#6366f1" },
  { horiz: false, pos: 25,  dur: 5.5, del: 2,    color: "#8b5cf6" },
  { horiz: false, pos: 45,  dur: 8.5, del: 1,    color: "#3b82f6" },
  { horiz: false, pos: 65,  dur: 6,   del: 3.5,  color: "#a855f7" },
  { horiz: false, pos: 80,  dur: 9,   del: 0,    color: "#6366f1" },
  { horiz: false, pos: 95,  dur: 5,   del: 2.5,  color: "#8b5cf6" },
];

export function AnimatedBeams({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* SVG beam layer – fills 100% */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {BEAMS.map((b, i) => {
            const id = `beam-grad-${i}`;
            return b.horiz ? (
              <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={b.color} stopOpacity="0" />
                <stop offset="50%"  stopColor={b.color} stopOpacity="1" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0" />
              </linearGradient>
            ) : (
              <linearGradient key={id} id={id} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor={b.color} stopOpacity="0" />
                <stop offset="50%"  stopColor={b.color} stopOpacity="1" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>

        {BEAMS.map((b, i) => {
          const id = `beam-grad-${i}`;
          if (b.horiz) {
            // Horizontal: a tall-ish thin rect sliding left to right
            return (
              <motion.rect
                key={i}
                x="-30%"
                y={`${b.pos - 0.08}%`}
                width="30%"
                height="0.16%"
                rx={1}
                fill={`url(#${id})`}
                initial={{ x: "-30%" }}
                animate={{ x: "130%" }}
                transition={{
                  duration: b.dur,
                  repeat: Infinity,
                  delay: b.del,
                  ease: "linear",
                  repeatDelay: 1,
                }}
              />
            );
          } else {
            // Vertical: a thin rect sliding top to bottom
            return (
              <motion.rect
                key={i}
                x={`${b.pos - 0.08}%`}
                y="-30%"
                width="0.16%"
                height="30%"
                rx={1}
                fill={`url(#${id})`}
                initial={{ y: "-30%" }}
                animate={{ y: "130%" }}
                transition={{
                  duration: b.dur,
                  repeat: Infinity,
                  delay: b.del,
                  ease: "linear",
                  repeatDelay: 1.5,
                }}
              />
            );
          }
        })}
      </svg>

      {/* Radial vignette so edges fade to black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, black 100%)",
        }}
      />
    </div>
  );
}
