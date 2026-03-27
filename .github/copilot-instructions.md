# JoJo's Bizarre Encyclopedia — Development Guidelines

Auto-generated from feature plans. Last updated: 2026-03-26

## Active Technologies

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 3.4, font Anton + Bebas Neue (manga style)
- **UI Components**: Shadcn/UI + Lucide Icons
- **Charts**: Recharts 2.x (`RadarChart` overlaid, 2x `<Radar>` components)
- **Database**: Supabase (PostgreSQL) — `@supabase/supabase-js`
- **AI/LLM**: OpenAI SDK — server-side only via `/api/battle` route
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm 8+
- **Scraper**: Node.js `fetch` + regex, gọi `jojo.fandom.com/api.php`

## Project Structure

```text
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx               # Battle Simulator page
│   ├── globals.css
│   └── api/battle/route.ts    # POST — AI battle analysis (server-side)
├── components/
│   ├── StandSelector.tsx
│   ├── BattleRadarChart.tsx
│   ├── BattleResult.tsx
│   └── AIExplanation.tsx
├── lib/
│   ├── supabase.ts            # anon key client
│   ├── stand-utils.ts         # stat mapping A→5
│   └── battle-ai.ts           # prompt builder (server-side)
├── scripts/scraper/
│   ├── scrape-stands.ts       # Fandom API → Supabase upsert
│   └── scraper-types.ts
├── types/stand.ts
└── specs/                     # Feature planning documents
```

## Commands

```bash
pnpm dev            # Dev server
pnpm build          # Production build
pnpm tsx scripts/scraper/scrape-stands.ts   # Nạp dữ liệu Stand từ Fandom
```

## Code Style

- **Tài liệu** (spec, plan, tasks): tiếng Việt
- **Code** (tên biến, hàm, component): tiếng Anh
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Dark mode mặc định: `#0A0A0A` background, `#FFFFFF` text, `#1E5BFF` accent
- Stand stats mapping: `A=5, B=4, C=3, D=2, E=1, None=0`

## Key Patterns

- **Radar chart**: `<RadarChart data={radarData}><Radar dataKey="standA" /><Radar dataKey="standB" /></RadarChart>`
- **Supabase read**: `anon` key từ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Supabase write** (scraper only): `service_role` key từ `SUPABASE_SERVICE_KEY`
- **AI call**: server-side trong `/api/battle/route.ts`, không bao giờ gọi OpenAI từ client

## Recent Features

1. **001-stand-battle-simulator** (2026-03-26): Scraper Fandom → Supabase, Battle Simulator UI, Radar chart overlaid, AI battle analysis bằng tiếng Việt

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
