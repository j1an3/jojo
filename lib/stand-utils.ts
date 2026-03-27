import type { Stand, RadarDataPoint, StatGrade } from "@/types/stand";

// Numeric mapping for Recharts RadarChart axes
export const STAT_MAP: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  None: 0,
};

// Human-readable labels for each stat key
export const STAT_LABELS: Record<keyof Stand["stats"], string> = {
  pow: "Power",
  spd: "Speed",
  rng: "Range",
  dur: "Durability",
  prc: "Precision",
  dev: "Potential",
};

// Ordered stat keys — determines polygon vertex order on radar chart
const STAT_ORDER: Array<keyof Stand["stats"]> = [
  "pow",
  "spd",
  "rng",
  "dur",
  "prc",
  "dev",
];

/**
 * Convert two Stand objects into a 6-element array for Recharts RadarChart.
 * Each element represents one vertex of the hexagon.
 */
export function buildRadarData(
  standA: Stand,
  standB: Stand
): RadarDataPoint[] {
  return STAT_ORDER.map((key) => {
    const letterA = (standA.stats[key] ?? "None") as StatGrade;
    const letterB = (standB.stats[key] ?? "None") as StatGrade;
    return {
      stat: STAT_LABELS[key],
      standA: STAT_MAP[letterA] ?? 0,
      standB: STAT_MAP[letterB] ?? 0,
      letterA,
      letterB,
    };
  });
}
