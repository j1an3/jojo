/**
 * scrape-vi-stands.ts
 *
 * Dùng Groq (llama-3.3-70b) dịch EN → VI cho tất cả stands trong Supabase.
 * Upsert ability_description_vi + weakness_vi.
 *
 * Chỉ xử lý stands có ability_description != null VÀ ability_description_vi == null
 * (idempotent — an toàn để chạy lại).
 *
 * Run: pnpm tsx scripts/scraper/scrape-vi-stands.ts
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   GROQ_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { translateToVI } from "../../lib/groq-translate";

loadDotenv({ path: ".env.local" });

// ── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Delay giữa mỗi stand để tránh rate-limit (Groq free: 30 req/min)
const DELAY_MS = 2200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍  Fetching stands from Supabase…");

  const { data: stands, error } = await supabase
    .from("stands")
    .select("id, name, ability_description, weakness, ability_description_vi")
    .not("ability_description", "is", null)
    .is("ability_description_vi", null)
    .order("name");

  if (error) {
    console.error("❌  Supabase error:", error.message);
    process.exit(1);
  }

  if (!stands || stands.length === 0) {
    console.log("✅  Tất cả stands đã có bản dịch VI. Không có gì để làm.");
    process.exit(0);
  }

  console.log(`📋  ${stands.length} stands cần dịch.\n`);

  let doneCount = 0;
  let skipCount = 0;

  for (let i = 0; i < stands.length; i++) {
    const stand = stands[i];
    const progress = `[${i + 1}/${stands.length}]`;

    const ability_vi = await translateToVI(stand.ability_description!);
    const weakness_vi = stand.weakness ? await translateToVI(stand.weakness) : null;

    if (ability_vi) {
      const { error: upsertError } = await supabase
        .from("stands")
        .update({ ability_description_vi: ability_vi, weakness_vi: weakness_vi ?? null })
        .eq("id", stand.id);

      if (upsertError) {
        console.error(`${progress} ❌  DB error for "${stand.name}": ${upsertError.message}`);
      } else {
        console.log(`${progress} 🤖  ${stand.name}`);
        doneCount++;
      }
    } else {
      console.warn(`${progress} ⚠️  skip  ${stand.name} (Groq trả về null)`);
      skipCount++;
    }

    if (i < stands.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n🎉  Hoàn tất!`);
  console.log(`   🤖 Đã dịch : ${doneCount}`);
  console.log(`   ⚠️  Bỏ qua  : ${skipCount}`);
}

main().catch((e) => {
  console.error("❌  Fatal:", e);
  process.exit(1);
});
