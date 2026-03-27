// Stand stat grades and numeric mapping
export type StatGrade = "A" | "B" | "C" | "D" | "E" | "None";

// Stats JSONB shape stored in Supabase
export interface StandStats {
  pow: StatGrade; // Destructive Power
  spd: StatGrade; // Speed
  rng: StatGrade; // Range
  dur: StatGrade; // Persistence / Durability
  prc: StatGrade; // Precision
  dev: StatGrade; // Development Potential
}

// Stand type enum (stored as plain string in DB for extensibility)
export type StandType =
  | "Close-Range Stand"
  | "Long-Range Stand"
  | "Automatic Stand"
  | "Bound Stand"
  | "Colony Stand"
  | "Remote-Control Stand"
  | "Other";

// Core Stand entity — mirrors the `stands` table in Supabase
export interface Stand {
  id: string; // UUID
  name: string;
  type: StandType | string;
  ability_description: string | null;
  ability_description_vi?: string | null;
  stats: StandStats;
  weakness: string | null;
  weakness_vi?: string | null;
  scraped_at?: string;
  source_url?: string | null;
}

// Character (Stand User) entity — mirrors the `characters` table
export interface Character {
  id: string; // UUID
  name: string;
  stand_id: string | null;
  part: number; // 1–9
  status: string | null; // "alive" | "deceased" | etc.
  image_url: string | null;
}

// One data point in the Recharts RadarChart (6 points total per battle)
export interface RadarDataPoint {
  stat: string;      // Human-readable label, e.g. "Power"
  standA: number;    // Numeric value 0–5
  standB: number;    // Numeric value 0–5
  letterA: StatGrade; // Original letter grade, e.g. "A"
  letterB: StatGrade;
}

// POST /api/battle — request body sent from client to server
export interface BattleRequest {
  standA: {
    name: string;
    type: string;
    ability_description: string | null;
    stats: StandStats;
    weakness: string | null;
  };
  standB: {
    name: string;
    type: string;
    ability_description: string | null;
    stats: StandStats;
    weakness: string | null;
  };
}

// POST /api/battle — response shape returned from AI analysis
export interface BattleResponse {
  explanation: string;     // Vietnamese, 100–200 words
  suggestedWinner: string; // Stand name or "Hòa"
}

// In-memory report produced by the scraper script
export interface ScrapingReport {
  total_found: number;
  total_upserted: number;
  total_skipped: number;
  skipped_reasons: Array<{ name: string; reason: string }>;
  duration_ms: number;
}
