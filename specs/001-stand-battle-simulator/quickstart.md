# Quickstart — Stand Battle Simulator

**Ngày**: 2026-03-26

Hướng dẫn để setup môi trường dev và chạy Battle Simulator từ đầu.

---

## 0. Yêu cầu

- Node.js ≥ 18
- pnpm ≥ 8 (`npm install -g pnpm`)
- Tài khoản Supabase (free tier đủ dùng)
- OpenAI API key (hoặc compatible LLM endpoint)

---

## 1. Khởi tạo project Next.js

```bash
pnpm create next-app@latest jojo-encyclopedia \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd jojo-encyclopedia
```

---

## 2. Cài dependencies

```bash
# UI và charts
pnpm add recharts @supabase/supabase-js openai
pnpm add lucide-react

# Shadcn/UI (interactive)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input command popover

# Font manga (thêm vào globals.css sau)
# Anton + Bebas Neue từ Google Fonts
```

---

## 3. Tạo Supabase Project

1. Vào [supabase.com](https://supabase.com) → New project
2. Vào **SQL Editor** → chạy migration UP từ [data-model.md](data-model.md):

```sql
-- Paste nội dung migration UP từ data-model.md vào đây
```

3. Lấy credentials từ **Project Settings → API**:
   - `Project URL`
   - `anon` public key
   - `service_role` key

---

## 4. Cấu hình Environment

Tạo file `.env.local` tại root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key...
OPENAI_API_KEY=sk-...your-openai-key...
```

> ⚠️ `SUPABASE_SERVICE_KEY` và `OPENAI_API_KEY` **KHÔNG** được có prefix `NEXT_PUBLIC_` —
> chỉ dùng server-side.

---

## 5. Chạy Scraper (nạp dữ liệu Stand)

Script cào toàn bộ Stand từ `jojo.fandom.com`:

```bash
# Chạy scraper (cần SUPABASE_SERVICE_KEY trong .env.local)
pnpm tsx scripts/scraper/scrape-stands.ts
```

**Thời gian dự kiến**: ~2–3 phút (350–400 Stand, delay 300ms/request).

**Output mẫu:**

```
[Scraper] Bắt đầu cào dữ liệu từ jojo.fandom.com...
[Scraper] Tìm thấy 387 Stand trong Category:Stands
[Scraper] Đang xử lý: Star Platinum (1/387)
...
[Scraper] Hoàn thành!
  ✅ Upserted: 374
  ⚠️  Skipped: 13
  Lý do bỏ qua: [{ name: "Heaven's Door", reason: "stats block không tìm thấy" }, ...]
  ⏱ Thời gian: 127.4s
```

---

## 6. Chạy Dev Server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) — trang Battle Simulator.

---

## 7. Kiểm tra nhanh

1. Tìm "Star Platinum" trong dropdown Stand A
2. Tìm "The World" trong dropdown Stand B
3. Bấm "Start Battle"
4. Biểu đồ Radar lục giác overlaid xuất hiện ngay lập tức
5. Lý giải AI (tiếng Việt) xuất hiện sau ≤ 10 giây

---

## 8. Cấu trúc thư mục sau khi setup

```text
jojo-encyclopedia/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/battle/route.ts
├── components/
│   ├── StandSelector.tsx
│   ├── BattleRadarChart.tsx
│   ├── BattleResult.tsx
│   └── AIExplanation.tsx
├── lib/
│   ├── supabase.ts
│   ├── stand-utils.ts
│   └── battle-ai.ts
├── scripts/scraper/
│   ├── scrape-stands.ts
│   └── scraper-types.ts
├── types/stand.ts
└── .env.local     ← không commit
```

---

## Troubleshooting

**Biểu đồ không hiển thị:**
→ Kiểm tra Recharts đã cài. Đảm bảo component có `"use client"` directive.

**Scraper lỗi 429 (rate limit):**
→ Tăng delay lên 500ms trong `scrape-stands.ts`.

**AI trả về lỗi:**
→ Kiểm tra `OPENAI_API_KEY` trong `.env.local`. Chạy `curl` để test key trực tiếp.

**Supabase trả về lỗi RLS:**
→ Đảm bảo đã chạy đúng migration và tạo policy `public read` cho cả 2 bảng.
