# Implementation Plan: Stand Battle Simulator

**Branch**: `001-stand-battle-simulator` | **Ngày**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: [specs/001-stand-battle-simulator/spec.md](spec.md)

---

## Tóm tắt

Xây dựng trang Battle Simulator cho phép người dùng chọn 2 Stand từ Supabase DB,
xem biểu đồ Radar lục giác overlaid so sánh 6 chỉ số, và đọc lý giải kết quả do AI
tạo ra bằng tiếng Việt. Đi kèm là script cào toàn bộ Stand từ `jojo.fandom.com` qua
MediaWiki API để nạp dữ liệu vào DB.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS 3.4, Shadcn/UI, Recharts 2.x, `@supabase/supabase-js`, OpenAI SDK
**Storage**: Supabase (PostgreSQL) — bảng `stands`, `characters`; `anon` key cho read, `service_role` key cho scraper
**Testing**: Không nằm trong scope v1
**Target Platform**: Web (SSR/CSR hybrid với Next.js)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Màn hình kết quả hiển thị < 3s (không tính AI); AI response < 10s
**Constraints**: Không có auth; API key LLM và Supabase service_role chỉ tồn tại server-side
**Scale/Scope**: ~350–400 Stand records; lưu lượng nhỏ (fan site)

---

## Constitution Check

_GATE: Phải vượt qua trước Phase 0 research. Kiểm tra lại sau Phase 1 design._

| #   | Nguyên tắc                     | Câu hỏi kiểm tra                                                                               | Trạng thái                                                                                     |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| I   | Manga-Style Visual Design      | Giao diện có Dark Mode + Radar Chart 6 chỉ số Stand không?                                     | ✅ Dark mode (#0A0A0A), font Anton/Bebas Neue, Recharts RadarChart overlaid                    |
| II  | Data Accuracy & Classification | Dữ liệu có phân loại theo Part 1-9 và Stand luôn liên kết User không?                          | ✅ `part` column (1-9), `stand_id` FK trong Characters                                         |
| III | Battle Simulator Logic         | Công thức battle có tính Stand Type, không chỉ so chỉ số thô, và LLM giải thích kết quả không? | ✅ AI suy luận từ ability + type + stats, không dùng công thức điểm cố định                    |
| IV  | Technology Stack Compliance    | Feature có dùng Next.js 14+ / Tailwind / Shadcn / Supabase / Recharts đúng không?              | ✅ Tất cả đều khớp                                                                             |
| V   | Core Data Schema Integrity     | Schema có tuân thủ 3 bảng cốt lõi không? Migration có rollback script không?                   | ✅ Dùng `stands` + `characters`; bảng `battles` loại khỏi scope; migration + rollback cung cấp |
| VI  | Communication & Code Quality   | Tài liệu viết tiếng Việt, code tiếng Anh, commit theo Conventional Commits không?              | ✅ Tài liệu spec/plan/tasks = tiếng Việt; code = tiếng Anh                                     |

**Kết quả**: ✅ 6/6 gates đạt — tiến hành Phase 1.

---

## Project Structure

### Tài liệu tính năng này

```text
specs/001-stand-battle-simulator/
├── plan.md          ← file này
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── database.md
│   └── api.md
└── tasks.md         ← tạo bởi /speckit.tasks (chưa tạo)
```

### Cấu trúc source code (repository root)

```text
/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Dark mode global styles)
│   ├── page.tsx                  # Trang chủ / Battle Simulator
│   ├── globals.css
│   └── api/
│       └── battle/
│           └── route.ts          # POST /api/battle — AI analysis endpoint
│
├── components/
│   ├── StandSelector.tsx         # Dropdown tìm kiếm + chọn Stand
│   ├── BattleRadarChart.tsx      # Recharts RadarChart overlaid (2 Stands)
│   ├── BattleResult.tsx          # Container kết quả (chart + winner banner)
│   └── AIExplanation.tsx         # Hiển thị lý giải AI + loading state
│
├── lib/
│   ├── supabase.ts               # Supabase client (anon key)
│   ├── stand-utils.ts            # Stat mapping (A→5, B→4…), radar data builder
│   └── battle-ai.ts              # Prompt builder + OpenAI call (server-side)
│
├── scripts/
│   └── scraper/
│       ├── scrape-stands.ts      # US4: Fandom MediaWiki API → Supabase upsert
│       └── scraper-types.ts      # Types dùng chỉ trong script
│
├── types/
│   └── stand.ts                  # Shared types: Stand, Character, RadarDataPoint
│
├── public/
├── .env.local                    # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, OPENAI_API_KEY
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

**Structure Decision**: Web application (Option 2 từ template: single Next.js project
kết hợp cả frontend components, API routes, và scraper script). Không cần tách
backend riêng vì Supabase đảm nhiệm toàn bộ DB layer.

---

## Complexity Tracking

> Không có vi phạm Constitution — không cần justify.

---

## Phase 0: Research — Đã hoàn thành ✅

Xem [research.md](research.md) để biết chi tiết. Tóm tắt quyết định:

| Vấn đề               | Quyết định                                                   | Tài liệu       |
| -------------------- | ------------------------------------------------------------ | -------------- |
| Scraping strategy    | MediaWiki API + regex parse wikitext                         | research.md §1 |
| Radar chart overlaid | Recharts 2x `<Radar>` + `fillOpacity=0.35`                   | research.md §2 |
| Stat value mapping   | A=5, B=4, C=3, D=2, E=1, None=0                              | research.md §2 |
| AI battle logic      | Server-side `/api/battle` route, AI suy luận từ ability      | research.md §3 |
| Supabase access      | `anon` key read-only client; `service_role` chỉ trong script | research.md §4 |

---

## Phase 1: Design & Contracts — Đã hoàn thành ✅

### Artifacts tạo ra

- [data-model.md](data-model.md) — Schema Supabase, migrations, seed
- [contracts/database.md](contracts/database.md) — Supabase public interface
- [contracts/api.md](contracts/api.md) — `POST /api/battle` contract
- [quickstart.md](quickstart.md) — Hướng dẫn setup dev environment

### Post-design Constitution Check

| #   | Nguyên tắc       | Trạng thái sau Phase 1                                            |
| --- | ---------------- | ----------------------------------------------------------------- |
| I   | Manga Visual     | ✅ BattleRadarChart confirmed overlaid, dark theme tokens defined |
| II  | Data Accuracy    | ✅ `part` SMALLINT CHECK (1-9); `stand_id` FK NOT NULL            |
| III | Battle Logic     | ✅ `/api/battle` nhận full Stand objects, AI prompt chuẩn         |
| IV  | Stack Compliance | ✅ Không có dependency ngoài stack                                |
| V   | Schema Integrity | ✅ Migration + rollback SQL có trong data-model.md                |
| VI  | Communication    | ✅ Tất cả tài liệu tiếng Việt                                     |
