"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/battle", label: "⚔️ Stand Battle" },
  { href: "/stands", label: "📋 Tra Cứu Stand" },
  { href: "/characters", label: "👥 Nhân Vật" },
  { href: "/family-tree", label: "🌳 Gia Phả" },
  { href: "/", label: "👤 Về Tôi" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="font-manga text-lg tracking-widest text-white hover:text-[#1E5BFF] transition-colors"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}>
          JoJo Bách Khoa
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[#1E5BFF]/15 text-[#1E5BFF] border border-[#1E5BFF]/30"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-[#888] hover:text-white p-2"
          aria-label="Toggle menu"
        >
          <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
          <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${open ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-current transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 pb-4">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-3 rounded-lg text-sm font-medium mt-1 transition-all ${
                  active
                    ? "bg-[#1E5BFF]/15 text-[#1E5BFF]"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
