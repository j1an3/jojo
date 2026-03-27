"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import WikiImage from "@/components/WikiImage";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  part: number;
  status?: string | null;
  image_url?: string | null;
  stand_id?: string | null;
  stand_name?: string;
}

const PART_NAMES: Record<number, string> = {
  1: "Phantom Blood",       2: "Battle Tendency",
  3: "Stardust Crusaders",  4: "Diamond is Unbreakable",
  5: "Vento Aureo",         6: "Stone Ocean",
  7: "Steel Ball Run",      8: "JoJolion",
  9: "The JOJOLands",
};

const PART_COLORS: Record<number, string> = {
  1: "#c084fc", 2: "#fb923c", 3: "#60a5fa",
  4: "#4ade80", 5: "#facc15", 6: "#f472b6",
  7: "#a78bfa", 8: "#34d399", 9: "#f87171",
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const lower = status.toLowerCase();
  const cfg =
    lower.includes("alive") || lower.includes("sống")
      ? { cls: "bg-green-900/30 text-green-400 border-green-800", label: "Còn sống" }
      : lower.includes("deceased") || lower.includes("dead") || lower.includes("mất")
      ? { cls: "bg-red-900/30 text-red-400 border-red-800", label: "Đã mất" }
      : { cls: "bg-[#1a1a1a] text-[#666] border-[#282828]", label: status };
  return (
    <span className={`inline-flex text-[9px] px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Character card ───────────────────────────────────────────────────────────

function CharCard({ c, color, onClick }: {
  c: Character;
  color: string;
  onClick: (c: Character) => void;
}) {
  return (
    <button
      onClick={() => onClick(c)}
      className="group flex flex-col bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#282828] hover:scale-[1.02] transition-all text-left"
      style={{ borderTopColor: `${color}30` }}
    >
      {/* Portrait */}
      {c.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.image_url}
          alt={c.name}
          className="w-full aspect-[3/4] object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <WikiImage
          title={c.name}
          size={180}
          className="w-full aspect-[3/4] object-cover"
          fallback="👤"
        />
      )}
      <div className="p-2 flex flex-col gap-1">
        <div className="text-white text-[11px] font-semibold leading-tight line-clamp-2">
          {c.name}
        </div>
        {c.stand_name && (
          <div className="text-[10px] leading-tight truncate" style={{ color: `${color}bb` }}>
            ⭐ {c.stand_name}
          </div>
        )}
        <StatusBadge status={c.status} />
      </div>
    </button>
  );
}

// ─── Character detail modal ───────────────────────────────────────────────────

function CharModal({ c, onClose }: { c: Character; onClose: () => void }) {
  const color = PART_COLORS[c.part] ?? "#888";

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: `linear-gradient(to right, ${color}, ${color}44)` }} />
        <div className="p-5">
          <div className="flex gap-4 mb-4">
            {/* Image */}
            <div className="w-28 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-[#111]">
              {c.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <WikiImage title={c.name} size={200} className="w-full h-full object-cover" fallback="👤" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold mb-0.5" style={{ color }}>
                Part {c.part} — {PART_NAMES[c.part] ?? ""}
              </div>
              <h2
                className="text-lg font-bold text-white leading-tight mb-2"
                style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
              >
                {c.name}
              </h2>
              <div className="space-y-1.5 text-xs">
                {c.stand_name && (
                  <div className="flex gap-2">
                    <span className="text-[#555] w-16 shrink-0">Stand</span>
                    <span className="text-[#1E5BFF] font-semibold">⭐ {c.stand_name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-[#555] w-16 shrink-0">Tình trạng</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Wiki link */}
          <a
            href={`https://jojo.fandom.com/wiki/${encodeURIComponent(c.name.replace(/ /g, "_"))}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#444] hover:text-[#1E5BFF] transition-colors"
          >
            📖 Xem trên JoJo Wiki ↗
          </a>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555] hover:text-white transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [partFilter, setPartFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    supabase
      .from("characters")
      .select("id, name, part, status, image_url, stand_id, stands(name)")
      .order("part", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const rows = (data as (Character & { stands?: { name?: string } })[]).map((r) => ({
            ...r,
            stand_name: r.stands?.name ?? undefined,
          }));
          setCharacters(rows);
        }
        setLoading(false);
      });
  }, []);

  const availableParts = [1,2,3,4,5,6,7,8,9].filter((p) =>
    characters.some((c) => c.part === p)
  );

  const filtered = characters.filter((c) => {
    const matchPart = partFilter === "all" || c.part === partFilter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.stand_name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchPart && matchSearch;
  });

  const grouped = filtered.reduce<Record<number, Character[]>>((acc, c) => {
    (acc[c.part] ??= []).push(c);
    return acc;
  }, {});

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1
          className="font-manga text-4xl md:text-5xl text-white tracking-wider mb-1"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
        >
          Nhân Vật
        </h1>
        <p className="text-[#555] text-sm">
          {characters.length > 0
            ? `${characters.length} nhân vật trong ${availableParts.length} part`
            : "Đang tải dữ liệu…"}
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc Stand…"
          className="w-full bg-[#111] border border-[#282828] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#1E5BFF]"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setPartFilter("all")}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              partFilter === "all"
                ? "bg-[#1E5BFF] border-[#1E5BFF] text-white"
                : "bg-[#111] border-[#282828] text-[#555] hover:border-[#444]"
            }`}
          >
            Tất cả
          </button>
          {availableParts.map((p) => (
            <button
              key={p}
              onClick={() => setPartFilter(p)}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
              style={
                partFilter === p
                  ? { background: PART_COLORS[p], borderColor: PART_COLORS[p], color: "#000" }
                  : { background: "#111", borderColor: "#282828", color: "#666" }
              }
            >
              P{p}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="bg-[#111] rounded-xl aspect-[3/5] animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-20 text-[#444]">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-sm">Chưa có dữ liệu nhân vật trong cơ sở dữ liệu.</p>
          <p className="text-xs mt-2 text-[#333]">Chạy scraper nhân vật để nạp dữ liệu.</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-[#444]">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-sm">Không tìm thấy nhân vật phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([partStr, chars]) => {
              const part = Number(partStr);
              const color = PART_COLORS[part] ?? "#888";
              return (
                <section key={part}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: color }} />
                    <h2
                      className="font-manga text-xl text-white tracking-widest"
                      style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
                    >
                      Part {part}
                    </h2>
                    <span className="text-sm" style={{ color }}>
                      {PART_NAMES[part]}
                    </span>
                    <div className="h-px flex-1 bg-[#1a1a1a]" />
                    <span className="text-xs text-[#444]">{chars.length} nhân vật</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {chars.map((c) => (
                      <CharCard key={c.id} c={c} color={color} onClick={setSelected} />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {selected && <CharModal c={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
