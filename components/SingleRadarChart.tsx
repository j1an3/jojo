"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { STAT_MAP, STAT_LABELS } from "@/lib/stand-utils";
import type { Stand } from "@/types/stand";

const STAT_ORDER = ["pow", "spd", "rng", "dur", "prc", "dev"] as const;

interface Props {
  stand: Stand;
  color?: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { letter: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-xs shadow-xl">
      <p className="text-[#888] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-bold text-white">{payload[0].payload.letter}</p>
    </div>
  );
}

export default function SingleRadarChart({ stand, color = "#1E5BFF" }: Props) {
  const data = STAT_ORDER.map((key) => {
    const letter = stand.stats[key] ?? "None";
    return {
      stat: STAT_LABELS[key],
      value: STAT_MAP[letter] ?? 0,
      letter,
    };
  });

  return (
    <ResponsiveContainer width="100%" aspect={1}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid gridType="polygon" stroke="#222" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: "#888", fontSize: 11, fontWeight: 500 }}
        />
        <Radar
          name={stand.name}
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.35}
          strokeWidth={2}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
