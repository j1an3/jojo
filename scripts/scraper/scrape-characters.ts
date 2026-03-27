/**
 * scrape-characters.ts
 *
 * Fetches JoJo characters from per-part categories on jojo.fandom.com,
 * extracts name/status/stand from the infobox wikitext, and upserts
 * into the Supabase `characters` table.
 *
 * Run with:  pnpm tsx scripts/scraper/scrape-characters.ts
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const FANDOM_API = "https://jojo.fandom.com/api.php";
const RATE_MS = 600;
const INTER_PART_MS = 8000;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Part → category mapping ───────────────────────────────────────────────────

const PART_CATEGORIES: Array<{ part: number; category: string; fallbacks?: string[] }> = [
  { part: 1, category: "Phantom Blood Characters" },
  { part: 2, category: "Battle Tendency Characters" },
  { part: 3, category: "Stardust Crusaders Characters" },
  { part: 4, category: "Diamond Is Unbreakable Characters", fallbacks: ["Diamond is Unbreakable Characters", "Part 4 Characters"] },
  { part: 5, category: "Vento Aureo Characters", fallbacks: ["Part 5 Characters"] },
  { part: 6, category: "Stone Ocean Characters", fallbacks: ["Part 6 Characters"] },
  { part: 7, category: "Steel Ball Run Characters", fallbacks: ["Part 7 Characters"] },
  { part: 8, category: "JoJolion Characters", fallbacks: ["Part 8 Characters"] },
  { part: 9, category: "The JOJOLands Characters", fallbacks: ["Part 9 Characters"] },
];

// ── Fetch all page titles from a category ────────────────────────────────────

async function fetchCategoryTitles(category: string): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmlimit: "100",
      cmtype: "page",
      format: "json",
      origin: "*",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);

    let text = "";
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const res = await fetch(`${FANDOM_API}?${params}`, {
        headers: { "User-Agent": "JoJo-Encyclopedia-Scraper/1.0" },
      });
      text = await res.text();
      if (text.startsWith("{")) break;
      const waitMs = 10000 * (attempt + 1);
      console.warn(`  ⚠️  Category rate limited, waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
      await sleep(waitMs);
    }
    if (!text.startsWith("{")) {
      console.warn(`  ⚠️  Category still rate limited after ${MAX_RETRIES} attempts. Giving up.`);
      break;
    }
    const json = JSON.parse(text);

    if (json.error) {
      console.warn(`  ⚠️  Category "${category}" not found or error: ${json.error.info}`);
      break;
    }

    const members: Array<{ title: string; ns: number }> = json.query?.categorymembers ?? [];
    // Only include article pages (namespace 0)
    titles.push(...members.filter((m) => m.ns === 0).map((m) => m.title));

    cmcontinue = json.continue?.cmcontinue;
    if (cmcontinue) await sleep(RATE_MS);
  } while (cmcontinue);

  return titles;
}

// ── Parse character wikitext ──────────────────────────────────────────────────

interface ParsedCharacter {
  name: string;
  part: number;
  status: string | null;
  stand_name: string | null;
  source_url: string;
}

function extractField(wikitext: string, ...keys: string[]): string | null {
  for (const key of keys) {
    // Match |key = value  (value ends at newline or next |)
    const m = wikitext.match(
      new RegExp(`\\|\\s*${key}\\s*=\\s*([^|\\n\\}]+)`, "i")
    );
    if (m) {
      return m[1]
        .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2") // unwrap [[link|text]]
        .replace(/<[^>]+>/g, "")                          // strip HTML tags
        .replace(/\{\{[^}]+\}\}/g, "")                   // strip templates
        .trim();
    }
  }
  return null;
}

function normalizeStatus(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("deceased") || lower.includes("dead") || lower.includes("killed")) return "Deceased";
  if (lower.includes("alive") || lower.includes("living")) return "Alive";
  if (lower.includes("unknown")) return "Unknown";
  return raw.split("\n")[0].trim().slice(0, 50) || null;
}

async function parseCharacterPage(title: string, part: number): Promise<ParsedCharacter | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
    origin: "*",
  });

  let text = "";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(`${FANDOM_API}?${params}`, {
      headers: { "User-Agent": "JoJo-Encyclopedia-Scraper/1.0" },
    });
    text = await res.text();
    if (text.startsWith("{")) break;
    const waitMs = 10000 * (attempt + 1);
    process.stdout.write(`\n  ⏳  Rate limited on "${title}", waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
    await sleep(waitMs);
  }
  if (!text.startsWith("{")) return null;
  const json = JSON.parse(text);

  if (json.error) return null;

  const wikitext: string = json.parse?.wikitext?.["*"] ?? "";
  const name = json.parse?.title ?? title;

  const rawStatus = extractField(wikitext, "status", "Status");
  const rawStand = extractField(wikitext, "stand", "Stand");

  return {
    name,
    part,
    status: normalizeStatus(rawStatus),
    stand_name: rawStand || null,
    source_url: `https://jojo.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

// ── Resolve stand_id from stands table ───────────────────────────────────────

async function buildStandLookup(): Promise<Map<string, string>> {
  const { data } = await sb.from("stands").select("id, name");
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set((row.name as string).toLowerCase(), row.id as string);
  }
  return map;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍  Building stand lookup table…");
  const standLookup = await buildStandLookup();
  console.log(`   ${standLookup.size} stands indexed.`);

  // Fetch already-inserted character names to skip duplicates
  const { data: existing } = await sb.from("characters").select("name");
  const existingNames = new Set((existing ?? []).map((r) => (r.name as string).toLowerCase()));
  console.log(`   ${existingNames.size} characters already in DB (will skip).`);

  let totalUpserted = 0;
  let totalSkipped = 0;

  for (const { part, category, fallbacks } of PART_CATEGORIES) {
    await sleep(INTER_PART_MS); // extra pause between parts to avoid rate limits
    console.log(`\n📂  Part ${part} — Category: "${category}"`);
    let allTitles = await fetchCategoryTitles(category);

    // Try fallback category names if primary returned nothing
    if (allTitles.length === 0 && fallbacks) {
      for (const fb of fallbacks) {
        console.log(`   ↳ Trying fallback: "${fb}"`);
        allTitles = await fetchCategoryTitles(fb);
        if (allTitles.length > 0) break;
        await sleep(1000);
      }
    }

    // Exclude meta-pages like "Unnamed Characters"
    const filtered = allTitles.filter(t => !t.toLowerCase().includes("unnamed"));
    console.log(`   ${filtered.length} pages found (${allTitles.length - filtered.length} unnamed filtered)`);

    if (filtered.length === 0) {
      console.log(`   ⚠️  No pages — skipping`);
      continue;
    }

    for (const title of filtered) {
      await sleep(RATE_MS);

      // Skip if already in DB
      if (existingNames.has(title.toLowerCase())) {
        process.stdout.write("s");
        continue;
      }

      const parsed = await parseCharacterPage(title, part);
      if (!parsed) {
        console.log(`   ⚠️  Skipped "${title}" (parse error)`);
        totalSkipped++;
        continue;
      }

      // Resolve stand_id
      const standId = parsed.stand_name
        ? (standLookup.get(parsed.stand_name.toLowerCase()) ?? null)
        : null;

      const row = {
        name: parsed.name,
        part: parsed.part,
        status: parsed.status,
        stand_id: standId,
      };

      const { error } = await sb
        .from("characters")
        .insert(row)
        .select("id")
        .maybeSingle()
        .then(async (res) => {
          // If insert fails with duplicate, try update by name
          if (res.error?.code === "23505") {
            return sb.from("characters").update({ part: row.part, status: row.status, stand_id: row.stand_id }).eq("name", row.name);
          }
          return res;
        });

      if (error) {
        console.error(`   ❌  ${parsed.name}: ${error.message}`);
        totalSkipped++;
      } else {
        process.stdout.write(".");
        totalUpserted++;
      }
    }

    console.log(`\n   ✅  Part ${part} done.`);
  }

  console.log(`\n🎉  Done — ${totalUpserted} upserted, ${totalSkipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
