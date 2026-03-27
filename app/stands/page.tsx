"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import SingleRadarChart from "@/components/SingleRadarChart";
import WikiImage from "@/components/WikiImage";
import type { Stand } from "@/types/stand";

const GRADE_COLORS: Record<string, string> = {
  A: "#1E5BFF",
  B: "#22d3ee",
  C: "#4ade80",
  D: "#facc15",
  E: "#f87171",
  None: "#444",
};

const STAT_LABELS: Record<string, string> = {
  pow: "威力",
  spd: "吗池",
  rng: "御居",
  dur: "持久",
  prc: "精密",
  dev: "潜力",
};

const STAT_LABELS_VI: Record<string, string> = {
  pow: "Sức Huỷ Diệt",
  spd: "Tốc Độ",
  rng: "Tầm Vươn",
  dur: "Độ Bền",
  prc: "Độ Chính Xác",
  dev: "Độ Phát Triển",
};

const STAT_LABELS_SHORT: Record<string, string> = {
  pow: "Lực",
  spd: "Tốc",
  rng: "Tầm",
  dur: "Bền",
  prc: "Xác",
  dev: "Phát",
};

function GradeBadge({ grade }: { grade: string }) {
  const color = GRADE_COLORS[grade] ?? "#444";
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold border"
      style={{ color, borderColor: `${color}55`, background: `${color}15` }}
    >
      {grade === "None" ? "−" : grade}
    </span>
  );
}

function StandModal({ stand, onClose }: { stand: Stand; onClose: () => void }) {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const hasVI = Boolean(stand.ability_description_vi);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  const hasStats = Object.values(stand.stats).some((v) => v !== "None");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0f0f0f] border border-[#222] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-[#1a1a1a] px-6 py-4 flex items-start justify-between">
          <div>
            <h2
              className="font-manga text-2xl text-white tracking-wider"
              style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
            >
              {stand.name}
            </h2>
            {stand.type && (
              <span className="text-xs text-[#1E5BFF] bg-[#1E5BFF]/10 border border-[#1E5BFF]/20 rounded-full px-2 py-0.5">
                {stand.type}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white transition-colors text-xl ml-4 mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Stand image + basic info */}
          <div className="flex gap-4 items-start">
            <WikiImage
              title={stand.name}
              size={200}
              className="w-28 h-36 object-cover rounded-xl flex-shrink-0 bg-[#111]"
              fallback="☄️"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Stand</div>
              <h3
                className="text-xl font-bold text-white leading-tight mb-2"
                style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
              >
                {stand.name}
              </h3>
              {stand.type && (
                <div className="text-xs text-[#1E5BFF] bg-[#1E5BFF]/10 border border-[#1E5BFF]/20 rounded-full px-2 py-0.5 inline-block mb-3">
                  {stand.type}
                </div>
              )}
              {/* Compact stat row */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(["pow", "spd", "rng", "dur", "prc", "dev"] as const)
                  .filter((k) => (stand.stats[k] ?? "None") !== "None")
                  .map((k) => (
                    <div key={k} className="flex items-center gap-1 bg-[#111] rounded-md px-2 py-1">
                      <span className="text-[9px] text-[#555] uppercase">{STAT_LABELS_SHORT[k]}</span>
                      <GradeBadge grade={stand.stats[k] ?? "None"} />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Radar chart */}
          {hasStats ? (
            <div className="w-full max-w-[240px] mx-auto">
              <SingleRadarChart stand={stand} color="#1E5BFF" />
            </div>
          ) : (
            <p className="text-[#444] text-sm text-center italic">Chưa có dữ liệu chỉ số</p>
          )}

          {/* Ability */}
          {stand.ability_description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#1E5BFF]">Năng Lực</h3>
                {/* Language toggle — only shown when VI data exists in DB */}
                {hasVI && (
                  <div className="flex items-center gap-0.5 bg-[#111] border border-[#222] rounded-lg p-0.5">
                    <button
                      onClick={() => setLang("en")}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${lang === "en" ? "bg-[#1E5BFF] text-white" : "text-[#555] hover:text-white"}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setLang("vi")}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${lang === "vi" ? "bg-[#1E5BFF] text-white" : "text-[#555] hover:text-white"}`}
                    >
                      VI
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-[#bbb] leading-relaxed">
                {lang === "vi" && stand.ability_description_vi
                  ? stand.ability_description_vi
                  : stand.ability_description}
              </p>
            </div>
          )}

          {/* Weakness */}
          {stand.weakness && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#FF4B4B] mb-2">Nhược Điểm</h3>
              <p className="text-sm text-[#bbb] leading-relaxed">
                {lang === "vi" && stand.weakness_vi
                  ? stand.weakness_vi
                  : stand.weakness}
              </p>
            </div>
          )}

          {/* Wiki link */}
          {stand.source_url && (
            <div className="pt-2 border-t border-[#1a1a1a]">
              <a
                href={stand.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[#555] hover:text-[#1E5BFF] transition-colors"
              >
                <span>📖</span>
                <span>Xem trên JoJo Wiki</span>
                <span>↗</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STAND_TYPES = [
  "All",
  "Close-Range Stand",
  "Long-Range Stand",
  "Automatic Stand",
  "Bound Stand",
  "Colony Stand",
  "Remote-Control Stand",
  "Other",
];

export default function StandsPage() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<Stand | null>(null);

  useEffect(() => {
    supabase
      .from("stands")
      .select("id, name, type, stats, ability_description, ability_description_vi, weakness, weakness_vi, source_url")
      .order("name")
      .then(({ data }) => {
        setStands((data ?? []) as Stand[]);
        setLoading(false);
      });
  }, []);

  const filtered = stands.filter((s) => {
    const matchName = s.name.toLowerCase().includes(query.toLowerCase());
    const matchType = typeFilter === "All" || s.type === typeFilter;
    return matchName && matchType;
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setSelected(null);
  }, []);

  const hasStats = (s: Stand) => Object.values(s.stats).some((v) => v !== "None");
  const topStat = (s: Stand): string => {
    const order = ["pow", "spd", "rng", "dur", "prc", "dev"] as const;
    for (const key of order) if (s.stats[key] === "A") return STAT_LABELS[key];
    return "";
  };

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 py-8" onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="mb-8">
        <h1
          className="font-manga text-4xl md:text-5xl text-white tracking-wider mb-1"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
        >
          Tra Cứu Stand
        </h1>
        <p className="text-[#555] text-sm">
          {loading ? "Đang tải…" : `${stands.length} Stand trong cơ sở dữ liệu`}
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm stand…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#1E5BFF]/50 focus:ring-1 focus:ring-[#1E5BFF]/30"
        />
        <select
          aria-label="Filter by Stand type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#1E5BFF]/50"
        >
          {STAND_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-[#444] text-xs mb-4">
          {filtered.length} kết quả
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#111] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((stand) => (
            <button
              key={stand.id}
              onClick={() => setSelected(stand)}
              className="group flex flex-col items-start text-left bg-[#111] hover:bg-[#141414] border border-[#1a1a1a] hover:border-[#1E5BFF]/40 rounded-xl p-3.5 transition-all hover:-translate-y-0.5"
            >
              <span className="font-semibold text-sm text-white leading-snug mb-1 group-hover:text-[#1E5BFF] transition-colors line-clamp-2">
                {stand.name}
              </span>
              {stand.type && stand.type !== "Other" && (
                <span className="text-[10px] text-[#555] leading-tight mb-1.5 line-clamp-1">
                  {stand.type}
                </span>
              )}
              {hasStats(stand) && (
                <div className="flex gap-1 flex-wrap mt-auto">
                  {(["pow", "spd", "rng", "dur", "prc", "dev"] as const)
                    .filter((k) => stand.stats[k] !== "None")
                    .slice(0, 6)
                    .map((k) => (
                      <span
                        key={k}
                        className="text-[10px] font-bold"
                        style={{ color: GRADE_COLORS[stand.stats[k]] }}
                      >
                        {stand.stats[k]}
                      </span>
                    ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[#444]">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Không tìm thấy stand nào cho &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {selected && (
        <StandModal stand={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
