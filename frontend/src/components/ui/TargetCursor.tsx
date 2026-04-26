"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TargetCursor({ className }: { className?: string }) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const isClickable = window.getComputedStyle(target).cursor === 'pointer' || 
                          target.tagName.toLowerCase() === 'a' || 
                          target.tagName.toLowerCase() === 'button';
      setIsHovering(isClickable);
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `body { cursor: none !important; }`}} />
      <motion.div
        className={cn("fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] mix-blend-difference flex items-center justify-center", className)}
        animate={{
          x: mousePos.x - 16,
          y: mousePos.y - 16,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      >
        {/* Outer Ring */}
        <motion.div 
          className="absolute inset-0 border border-white rounded-full opacity-50"
          animate={{ scale: isHovering ? 0.8 : 1 }}
        />
        {/* Center Dot */}
        <motion.div 
          className="w-1.5 h-1.5 bg-white rounded-full"
          animate={{ scale: isHovering ? 0 : 1 }}
        />
        {/* Crosshair Lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] -translate-x-1/2 bg-white/30 h-full" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] -translate-y-1/2 bg-white/30 w-full" />
      </motion.div>
    </>
  );
}
