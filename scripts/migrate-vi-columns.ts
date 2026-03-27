import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const pat = process.env.SUPABASE_ACCESS_TOKEN!;

  if (!url || !pat) {
    console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN");
    process.exit(1);
  }

  const ref = url.replace("https://", "").split(".")[0];
  console.log("Project ref:", ref);

  const sql = `
    ALTER TABLE stands ADD COLUMN IF NOT EXISTS ability_description_vi TEXT;
    ALTER TABLE stands ADD COLUMN IF NOT EXISTS weakness_vi TEXT;
  `;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pat}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text = await res.text();
  if (res.ok) {
    console.log("✅  Migration thành công! Cả 2 cột đã được thêm.");
  } else {
    console.error(`❌  Status ${res.status}: ${text.substring(0, 400)}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
