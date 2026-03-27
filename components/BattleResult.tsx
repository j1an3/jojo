"use client";

import dynamic from "next/dynamic";
import AIExplanation from "@/components/AIExplanation";
import type { Stand } from "@/types/stand";

// Recharts uses browser APIs — must be dynamically imported with ssr:false
const BattleRadarChart = dynamic(
  () => import("@/components/BattleRadarChart"),
  { ssr: false, loading: () => <div className="w-full aspect-square max-w-sm mx-auto flex items-center justify-center text-[#444] text-sm">Loading chart…</div> }
);

interface BattleResultProps {
  standA: Stand;
  standB: Stand;
  onReset: () => void;
}

export default function BattleResult({
  standA,
  standB,
  onReset,
}: BattleResultProps) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header — VS banner */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-[#888] text-xs uppercase tracking-widest mb-1">
            Stand A
          </p>
          <h2
            className="font-manga text-2xl md:text-3xl text-accent"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
          >
            {standA.name}
          </h2>
          <p className="text-[#666] text-xs mt-1">{standA.type}</p>
        </div>

        <div
          className="font-manga text-4xl md:text-5xl text-white/20 flex-shrink-0"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
        >
          VS
        </div>

        <div className="flex-1 text-center">
          <p className="text-[#888] text-xs uppercase tracking-widest mb-1">
            Stand B
          </p>
          <h2
            className="font-manga text-2xl md:text-3xl text-accent-red"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
          >
            {standB.name}
          </h2>
          <p className="text-[#666] text-xs mt-1">{standB.type}</p>
        </div>
      </div>

      {/* Radar chart */}
      <div className="w-full max-w-sm mx-auto">
        <BattleRadarChart standA={standA} standB={standB} />
      </div>

      {/* AI explanation — independent of chart; errors show separately */}
      <AIExplanation standA={standA} standB={standB} />

      {/* Reset button */}
      <button
        onClick={onReset}
        className="mx-auto mt-2 px-6 py-2 border border-[#333] text-[#888] rounded-lg hover:border-[#555] hover:text-white transition-colors text-sm"
      >
        ← New Battle
      </button>
    </div>
  );
}
