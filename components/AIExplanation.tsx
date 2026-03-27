"use client";

import { useEffect, useState } from "react";
import type { Stand, BattleResponse } from "@/types/stand";

interface AIExplanationProps {
  standA: Stand;
  standB: Stand;
}

type Status = "loading" | "success" | "error";

export default function AIExplanation({ standA, standB }: AIExplanationProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<BattleResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function analyse() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standA, standB }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data: BattleResponse = await res.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  useEffect(() => {
    analyse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standA.id, standB.id]);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="w-full border border-[#222] rounded-xl p-6 flex flex-col items-center gap-3 text-[#666]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm">Đang phân tích trận đấu…</p>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="w-full border border-red-900/40 rounded-xl p-6 flex flex-col gap-3">
        <p className="text-red-400 text-sm">
          Không thể tải phân tích AI: {errorMsg}
        </p>
        <button
          onClick={analyse}
          className="self-start text-xs px-4 py-2 border border-[#333] text-[#888] rounded-lg hover:text-white hover:border-[#555] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full border border-[#222] rounded-xl p-6 flex flex-col gap-4">
      {/* Winner badge */}
      <div className="flex items-center gap-3">
        <span className="text-[#555] text-xs uppercase tracking-widest">
          AI Prediction
        </span>
        <span
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{
            background:
              result!.suggestedWinner === "Hòa"
                ? "rgba(255,255,100,0.1)"
                : result!.suggestedWinner === standA.name
                ? "rgba(30,91,255,0.15)"
                : "rgba(255,75,75,0.15)",
            color:
              result!.suggestedWinner === "Hòa"
                ? "#ffff64"
                : result!.suggestedWinner === standA.name
                ? "#1E5BFF"
                : "#FF4B4B",
            border: "1px solid currentColor",
          }}
        >
          {result!.suggestedWinner === "Hòa"
            ? "Hòa"
            : `${result!.suggestedWinner} thắng`}
        </span>
      </div>

      {/* Explanation paragraph */}
      <p className="text-[#ccc] text-sm leading-relaxed">{result!.explanation}</p>
    </div>
  );
}
