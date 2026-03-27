"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import StandSelector from "@/components/StandSelector";
import BattleResult from "@/components/BattleResult";
import type { Stand } from "@/types/stand";

type AppMode = "select" | "result";

export default function BattlePage() {
  const [mode, setMode] = useState<AppMode>("select");
  const [standA, setStandA] = useState<Stand | null>(null);
  const [standB, setStandB] = useState<Stand | null>(null);

  const canBattle = standA !== null && standB !== null;

  function handleStart() {
    if (canBattle) setMode("result");
  }

  function handleReset() {
    setMode("select");
    setStandA(null);
    setStandB(null);
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      {/* Page header */}
      <header className="text-center mb-12">
        <h1
          className="font-manga text-5xl md:text-6xl text-white tracking-wider mb-2"
          style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
        >
          Stand Battle
        </h1>
        <p className="text-[#555] text-sm tracking-widest uppercase">
          JoJo&apos;s Bizarre Bách Khoa
        </p>
      </header>

      {mode === "select" && (
        <section className="flex flex-col gap-8">
          {/* Stand selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StandSelector
              label="Stand A"
              selected={standA}
              onSelect={setStandA}
              excludeId={standB?.id}
              accentColor="#1E5BFF"
            />
            <StandSelector
              label="Stand B"
              selected={standB}
              onSelect={setStandB}
              excludeId={standA?.id}
              accentColor="#FF4B4B"
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!canBattle}
            className="w-full py-4 rounded-xl font-manga text-lg tracking-widest uppercase transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              enabled:bg-accent enabled:text-white enabled:hover:brightness-110 enabled:active:scale-[0.98]"
            style={{ fontFamily: "var(--font-bebas), var(--font-anton), sans-serif" }}
          >
            {canBattle ? "Bắt đầu trận đấu" : "Chọn 2 Stand để bắt đầu"}
          </button>
        </section>
      )}

      {mode === "result" && standA && standB && (
        <BattleResult standA={standA} standB={standB} onReset={handleReset} />
      )}
    </main>
  );
}
