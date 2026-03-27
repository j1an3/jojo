"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { buildRadarData } from "@/lib/stand-utils";
import type { Stand, RadarDataPoint } from "@/types/stand";

const COLOR_A = "#1E5BFF";
const COLOR_B = "#FF4B4B";

interface BattleRadarChartProps {
  standA: Stand;
  standB: Stand;
}

// Custom tooltip: shows letter grade instead of raw number
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: RadarDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as RadarDataPoint;

  return (
    <div className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#888] uppercase tracking-wider mb-1">{label}</p>
      <p style={{ color: COLOR_A }}>
        {payload[0]?.name}: <span className="font-bold">{point.letterA}</span>
      </p>
      <p style={{ color: COLOR_B }}>
        {payload[1]?.name}: <span className="font-bold">{point.letterB}</span>
      </p>
    </div>
  );
}

export default function BattleRadarChart({
  standA,
  standB,
}: BattleRadarChartProps) {
  const radarData = buildRadarData(standA, standB);

  return (
    <ResponsiveContainer width="100%" aspect={1}>
      <RadarChart
        data={radarData}
        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
      >
        <PolarGrid
          gridType="polygon"
          stroke="#222"
        />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: "#888", fontSize: 11, fontWeight: 500 }}
        />

        {/* Stand A overlay */}
        <Radar
          name={standA.name}
          dataKey="standA"
          stroke={COLOR_A}
          fill={COLOR_A}
          fillOpacity={0.35}
          strokeWidth={2}
        />

        {/* Stand B overlay */}
        <Radar
          name={standB.name}
          dataKey="standB"
          stroke={COLOR_B}
          fill={COLOR_B}
          fillOpacity={0.35}
          strokeWidth={2}
        />

        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
          formatter={(value: string, entry: { color?: string }) => (
            <span style={{ color: entry.color }}>{value}</span>
          )}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
