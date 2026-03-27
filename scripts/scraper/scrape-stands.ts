/**
 * scrape-stands.ts
 *
 * Fetches all Stand pages from jojo.fandom.com using the MediaWiki API,
 * extracts stats and metadata via regex, and upserts into Supabase.
 *
 * Run with:  pnpm tsx scripts/scraper/scrape-stands.ts
 *
 * Required env vars (in .env.local or process environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import type {
  ParsedStand,
  WikiCategoryResponse,
  WikiParseResponse,
} from "./scraper-types";
import type { ScrapingReport } from "../../types/stand";

// ── Load env vars ───────────────────────────────────────────────────────────
// Support both .env.local (Next.js convention) and raw env vars
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌  Missing env vars. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local"
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Constants ───────────────────────────────────────────────────────────────
const FANDOM_API = "https://jojo.fandom.com/api.php";
const RATE_LIMIT_MS = 300; // ~3 req/s — respectful of wiki rate limits
const VALID_GRADES = new Set(["A", "B", "C", "D", "E", "None"]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeGrade(raw: string | undefined | null): string {
  if (!raw) return "None";
  const grade = raw.trim().replace(/\{\{Null\}\}/i, "None").toUpperCase();
  if (grade === "NONE" || grade === "") return "None";
  if (VALID_GRADES.has(grade)) return grade;
  // Handle edge cases like "A+" → "A"
  const first = grade[0];
  return VALID_GRADES.has(first) ? first : "None";
}

// ── Fetch all Stand page titles via Category:Stands ─────────────────────────

async function fetchAllStandTitles(): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:Stands",
      cmlimit: "50",
      cmtype: "page",
      format: "json",
      origin: "*",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);

    const url = `${FANDOM_API}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "JoJo-Encyclopedia-Scraper/1.0" },
    });
    if (!res.ok) throw new Error(`Category fetch failed: ${res.status}`);

    const data: WikiCategoryResponse = await res.json();
    if (data.error) throw new Error(`Fandom API error: ${data.error.info}`);

    const members = data.query?.categorymembers ?? [];
    for (const m of members) {
      // Skip redirect/disambiguation, talk pages, template pages, and meta pages
      const t = m.title;
      if (
        t.includes("(disambiguation)") ||
        t.includes("Talk:") ||
        t.startsWith("Template:") ||
        t === "Stand" ||
        t === "Stand Types" ||
        t === "Stand Growth" ||
        t === "List of Unnamed Stands"
      ) continue;
      titles.push(t);
    }

    cmcontinue = data.continue?.cmcontinue;
    if (cmcontinue) await sleep(RATE_LIMIT_MS);
  } while (cmcontinue);

  return titles;
}

// ── Fetch + parse a single Stand page ───────────────────────────────────────

async function fetchAndParseStand(
  title: string
): Promise<ParsedStand | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
    origin: "*",
  });

  const url = `${FANDOM_API}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "JoJo-Encyclopedia-Scraper/1.0" },
  });
  if (!res.ok) return null;

  const data: WikiParseResponse = await res.json();
  if (data.error || !data.parse) return null;

  const wikitext = data.parse.wikitext["*"];
  const sourceUrl = `https://jojo.fandom.com/wiki/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;

  // ── Extract stats block {{Stats|...}} ─────────────────────────────────────
  // Use nested-brace-aware regex: handles {{Null}}, {{Color|...}} etc. inside
  const statsMatch = wikitext.match(/\{\{Stats(?:[^{}]|\{\{[^{}]*\}\})*\}\}/i);

  const extractStat = (key: string): string => {
    if (!statsMatch) return "None";
    const pattern = new RegExp(`${key}\\s*=\\s*([A-Ea-e]|\\{\\{Null\\}\\})`, "i");
    const m = statsMatch[0].match(pattern);
    return normalizeGrade(m?.[1]);
  };

  // BUG FIX: "None" is truthy, so `extractStat("pow") || extractStat("power")`
  // would always short-circuit on "None". Use explicit helper instead.
  const getStat = (...keys: string[]): string => {
    for (const key of keys) {
      const v = extractStat(key);
      if (v !== "None") return v;
    }
    return "None";
  };

  const stats = {
    pow: getStat("pow", "power"),
    spd: getStat("spd", "speed"),
    rng: getStat("rng", "range"),
    dur: getStat("dur", "persistence", "durability"),
    prc: getStat("prc", "precision"),
    dev: getStat("dev", "potential", "development"),
  };

  // ── Extract Stand type ────────────────────────────────────────────────────
  // BUG FIX: old regex [^\n|{}[\]] excluded '[' so [[...]] links never matched.
  // Capture full line then strip wiki markup.
  const typeMatch = wikitext.match(/\|\s*(?:powertype|type)\s*=\s*([^\n]+)/i);
  const rawType = typeMatch?.[1]?.trim() ?? "";
  const type =
    rawType
      // [[Page#section|Display]] → Display (or Page if no display)
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Other";

  // ── Extract Stand User ────────────────────────────────────────────────────
  const userMatch = wikitext.match(
    /\|\s*user\s*=\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/i
  );
  const user_name = userMatch?.[1]?.trim() ?? null;

  // ── Extract Part number from category ─────────────────────────────────────
  const partMatch = wikitext.match(/\[\[Category:Part\s+(\d+)\s+Stands\]\]/i);
  const part_number = partMatch ? parseInt(partMatch[1], 10) : null;

  // ── Extract ability description ───────────────────────────────────────────
  // Approach: find ==Abilities== section, then extract text until next ==Section==
  let ability_description: string | null = null;
  const abHeadIdx = wikitext.search(/^==\s*Abilit(?:y|ies)\s*==/im);
  if (abHeadIdx >= 0) {
    // Skip past the heading line itself
    const afterHeading = wikitext.substring(abHeadIdx).replace(/^.*\n/, "");
    // Find where the next level-2 section (==...==, not ===) begins
    const nextSection = afterHeading.search(/^==[^=]/m);
    const sectionContent = nextSection >= 0
      ? afterHeading.substring(0, nextSection)
      : afterHeading.substring(0, 3000);
    const raw = sectionContent
      .replace(/===[\s\S]*?===/g, "")           // remove sub-headings + their content
      .replace(/\{\{[^}]*\}\}/g, "")            // templates
      .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "") // file links
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1") // wiki links → text
      .replace(/'''?|''?/g, "")                // bold/italic
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "") // citations
      .replace(/<[^>]+>/g, "")                 // other HTML
      .replace(/\*\s*/g, "")                   // bullet points
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    ability_description = raw.length >= 20 ? raw.substring(0, 400) : null;
  }

  // ── Extract weakness ─────────────────────────────────────────────────────
  let weakness: string | null = null;
  const weakHeadIdx = wikitext.search(/^==\s*Weakness(?:es)?\s*==/im);
  if (weakHeadIdx >= 0) {
    const afterHeading = wikitext.substring(weakHeadIdx).replace(/^.*\n/, "");
    const nextSection = afterHeading.search(/^==[^=]/m);
    const sectionContent = nextSection >= 0
      ? afterHeading.substring(0, nextSection)
      : afterHeading.substring(0, 1500);
    const raw = sectionContent
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/'''?|''?/g, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\*\s*/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    weakness = raw.length >= 10 ? raw.substring(0, 300) : null;
  }

  return {
    name: data.parse.title,
    type,
    ability_description,
    stats,
    weakness,
    user_name,
    part_number,
    source_url: sourceUrl,
  };
}

// ── Upsert to Supabase ───────────────────────────────────────────────────────

async function upsertStand(parsed: ParsedStand): Promise<void> {
  // 1. Upsert stand
  const { data: standRow, error: standError } = await supabaseAdmin
    .from("stands")
    .upsert(
      {
        name: parsed.name,
        type: parsed.type,
        ability_description: parsed.ability_description,
        stats: parsed.stats,
        weakness: parsed.weakness,
        source_url: parsed.source_url,
        scraped_at: new Date().toISOString(),
      },
      { onConflict: "name" }
    )
    .select("id")
    .single();

  if (standError) throw new Error(`Stand upsert failed: ${standError.message}`);

  // 2. Upsert character (Stand User) if name available
  if (parsed.user_name && parsed.part_number) {
    await supabaseAdmin.from("characters").upsert(
      {
        name: parsed.user_name,
        stand_id: standRow.id,
        part: parsed.part_number,
      },
      { onConflict: "name,part" }
    );
    // Silently ignore character upsert errors to not block overall progress
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const report: ScrapingReport = {
    total_found: 0,
    total_upserted: 0,
    total_skipped: 0,
    skipped_reasons: [],
    duration_ms: 0,
  };

  console.log("🔍  Fetching Stand titles from Category:Stands …");
  const titles = await fetchAllStandTitles();
  report.total_found = titles.length;
  console.log(`📋  Found ${titles.length} Stand pages. Starting parse+upsert …\n`);

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const progress = `[${i + 1}/${titles.length}]`;

    try {
      const parsed = await fetchAndParseStand(title);

      if (!parsed) {
        report.total_skipped++;
        report.skipped_reasons.push({ name: title, reason: "Failed to fetch or parse wikitext" });
        console.warn(`⚠️   ${progress} SKIP  ${title}`);
      } else {
        await upsertStand(parsed);
        report.total_upserted++;
        console.log(`✅  ${progress} OK    ${title}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.total_skipped++;
      report.skipped_reasons.push({ name: title, reason: message });
      console.warn(`❌  ${progress} ERR   ${title} — ${message}`);
    }

    // Rate limit between requests
    if (i < titles.length - 1) await sleep(RATE_LIMIT_MS);
  }

  report.duration_ms = Date.now() - startTime;

  // ── Final report ──────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊  Scraping Report");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Total found   : ${report.total_found}`);
  console.log(`   Upserted      : ${report.total_upserted}`);
  console.log(`   Skipped       : ${report.total_skipped}`);
  console.log(`   Duration      : ${(report.duration_ms / 1000).toFixed(1)}s`);

  if (report.skipped_reasons.length > 0) {
    console.log("\n   Skipped pages:");
    for (const { name, reason } of report.skipped_reasons) {
      console.log(`     • ${name}: ${reason}`);
    }
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
