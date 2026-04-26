"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_LINKS = ["Overview", "Tables", "Lineage", "Intelligence"];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex items-center gap-1 glass-nav rounded-full px-2 py-2 shadow-xl shadow-black/50 bg-black/60 backdrop-blur-md border border-[#333]">
        <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0">
          <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
          <span className="font-semibold text-white text-sm">Meridian</span>
        </Link>
        <div className="w-px h-4 bg-[#333] mx-1" />
        {NAV_LINKS.map((link) => {
          const href = link === "Overview" ? "/dashboard" : `/dashboard/${link.toLowerCase()}`;
          const isActive = pathname === href || (pathname.startsWith(href) && href !== "/dashboard");

          return (
            <Link
              key={link}
              href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {link}
            </Link>
          );
        })}
        <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 ml-1">A</div>
      </nav>
    </div>
  );
}
