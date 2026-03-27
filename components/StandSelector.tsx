"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Stand } from "@/types/stand";

interface StandSelectorProps {
  label: string;
  selected: Stand | null;
  onSelect: (stand: Stand) => void;
  excludeId?: string;
  accentColor?: string;
}

export default function StandSelector({
  label,
  selected,
  onSelect,
  excludeId,
  accentColor = "#1E5BFF",
}: StandSelectorProps) {
  const [stands, setStands] = useState<Stand[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  // Fetch all stands once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("stands")
        .select("id, name, type, stats, ability_description, weakness")
        .order("name", { ascending: true });

      if (cancelled) return;
      setLoading(false);
      if (error || !data || data.length === 0) {
        setEmpty(true);
        return;
      }
      setStands(data as Stand[]);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Client-side filter
  const filtered = stands.filter(
    (s) =>
      s.id !== excludeId &&
      s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        className="font-manga text-sm tracking-widest uppercase"
        style={{ color: accentColor }}
      >
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-white hover:border-[#444] transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {selected ? (
          <span className="font-semibold">{selected.name}</span>
        ) : (
          <span className="text-[#555]">Choose a Stand…</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-50 bg-[#111] border border-[#333] rounded-lg shadow-2xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-[#222]">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Stands…"
                className="w-full bg-[#0a0a0a] text-white text-sm px-3 py-2 rounded border border-[#333] focus:outline-none focus:border-accent placeholder-[#555]"
              />
            </div>

            {/* List */}
            <ul className="max-h-64 overflow-y-auto">
              {loading ? (
                <li className="px-4 py-3 text-[#555] text-sm">Loading…</li>
              ) : empty ? (
                <li className="px-4 py-3 text-yellow-500 text-sm">
                  Dữ liệu chưa sẵn sàng — hãy chạy scraper trước.
                </li>
              ) : filtered.length === 0 ? (
                <li className="px-4 py-3 text-[#555] text-sm">
                  No Stands match &quot;{query}&quot;
                </li>
              ) : (
                filtered.map((stand) => (
                  <li key={stand.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(stand);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="text-white font-medium text-sm">
                        {stand.name}
                      </div>
                      <div className="text-[#555] text-xs mt-0.5">
                        {stand.type}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
