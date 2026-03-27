# Tasks: Stand Battle Simulator

**Input**: `specs/001-stand-battle-simulator/`
**Ngày**: 2026-03-26
**Branch**: `001-stand-battle-simulator`

## Format: `[ID] [P?] [Story] Mô tả + đường dẫn file`

- **[P]**: Có thể chạy song song (file khác nhau, không phụ thuộc task chưa hoàn thành)
- **[Story]**: User Story tương ứng ([US1]–[US4])
- Chỉ Phase Setup và Foundational không có story label

---

## Phase 1: Setup (Khởi tạo dự án)

**Mục tiêu**: Tạo Next.js project với đầy đủ dependencies và cấu hình cơ bản.

- [x] T001 Khởi tạo Next.js 14+ App Router project bằng `pnpm create next-app` với TypeScript, Tailwind CSS, ESLint tại thư mục gốc repository
- [x] T002 [P] Cài đặt dependencies chính: `recharts @supabase/supabase-js openai` vào `package.json`
- [x] T003 [P] Cài đặt và khởi tạo Shadcn/UI với `pnpm dlx shadcn@latest init`, thêm component `command` (combobox) cho StandSelector

**Checkpoint**: `pnpm dev` khởi động thành công trên `localhost:3000`.

---

## Phase 2: Foundational (Tiền đề – CHẶN mọi User Story)

**Mục tiêu**: Schema DB, shared types, Supabase client, dark mode layout — phải hoàn thành trước khi bắt đầu bất kỳ User Story nào.

**⚠️ CRITICAL**: Không được bắt đầu Phase 3+ trước khi Phase này hoàn thành.

- [x] T004 Tạo file `.env.local` tại root với 4 biến: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY` (xem `contracts/database.md` để biết tên biến chính xác)
- [x] T005 Tạo Supabase project, chạy migration SQL từ `specs/001-stand-battle-simulator/data-model.md` (tạo bảng `stands` + `characters`, RLS read-public policy, index trên `stands.name`)
- [x] T006 [P] Tạo `types/stand.ts` với các types: `Stand`, `Character`, `RadarDataPoint`, `BattleRequest`, `BattleResponse`, `ScrapingReport` (xem `contracts/api.md` và `data-model.md`)
- [x] T007 [P] Tạo `lib/supabase.ts` — Supabase client dùng `NEXT_PUBLIC_SUPABASE_ANON_KEY` (theo pattern trong `contracts/database.md`)
- [x] T008 [P] Tạo `app/layout.tsx` và `app/globals.css` — Root layout Dark mode với background `#0A0A0A`, text `#FFFFFF`, import font Anton + Bebas Neue từ `next/font/google`
- [x] T009 Tạo `lib/stand-utils.ts` với:
  - Hằng số `STAT_MAP: Record<string, number>` — ánh xạ `A→5, B→4, C→3, D→2, E→1, None→0`
  - Hàm `buildRadarData(standA: Stand, standB: Stand): RadarDataPoint[]` — chuyển 6 chỉ số thành mảng 6 điểm cho Recharts (mỗi điểm gồm `stat`, `standA`, `standB`, `letterA`, `letterB`)

**Checkpoint**: Types compile đúng (`pnpm tsc --noEmit`), Supabase migration thành công.

---

## Phase 3: User Story 4 — Scraper Fandom → Supabase (Ưu tiên: P0)

**Mục tiêu**: Nạp toàn bộ dữ liệu Stand thực từ `jojo.fandom.com` vào DB trước khi UI có thể hoạt động với dữ liệu thật.

**Kiểm thử độc lập**: Chạy `pnpm tsx scripts/scraper/scrape-stands.ts`. DB phải chứa ≥50 Stand với đủ 6 chỉ số và Stand User liên kết. Chạy lại lần 2 — không có bản ghi trùng lặp.

- [x] T010 [P] [US4] Tạo `scripts/scraper/scraper-types.ts` — types chỉ dùng trong scraper: `RawStandPage` (wikitext string), `ParsedStand` (name, type, stats raw, ability_description, weakness, user_name, part_number, source_url)
- [x] T011 [US4] Tạo `scripts/scraper/scrape-stands.ts` với luồng đầy đủ:
  1. Fetch paginated `Category:Stands` từ `https://jojo.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Stands&cmlimit=50&format=json`
  2. Với mỗi trang Stand: fetch wikitext qua `action=parse&page={NAME}&prop=wikitext&format=json`
  3. Regex extract `{{Stats|pow=A|spd=A|rng=C|dur=A|prc=A|dev=A}}`, `|user =`, `|type =`, `|powertype =`, `[[Category:Part N Stands]]`
  4. Giá trị thiếu → `"None"` (không bỏ qua bản ghi)
  5. Upsert vào `stands` + `characters` qua `SUPABASE_SERVICE_KEY` với `onConflict: 'name'`
  6. Rate limit: delay 300ms giữa các request
  7. In `ScrapingReport` khi hoàn thành (total_found, total_upserted, total_skipped, skipped_reasons, duration_ms)
- [ ] T012 [US4] Chạy `pnpm tsx scripts/scraper/scrape-stands.ts`, xác nhận trong Supabase Dashboard: ≥50 stands có `stats` JSONB đầy đủ và `characters` có `stand_id` FK hợp lệ

**Checkpoint**: DB có dữ liệu Stand thực — US1–US3 có thể bắt đầu với dữ liệu thật.

---

## Phase 4: User Story 1 — Chọn 2 Stand và bắt đầu trận đấu (Ưu tiên: P1) 🎯 MVP

**Mục tiêu**: Người dùng chọn Stand A và Stand B từ DB, bấm nút để chuyển sang màn hình kết quả. Toàn bộ tính năng này hoạt động độc lập không cần chart hay AI.

**Kiểm thử độc lập**: Mở `localhost:3000`, gõ "Star" vào StandSelector, thấy danh sách lọc, chọn cả 2 Stand, bấm "Bắt đầu trận đấu" — màn hình chuyển sang BattleResult trong ≤3s.

- [x] T013 [P] [US1] Tạo `components/StandSelector.tsx`:
  - Combobox (Shadcn/UI `Command`) với search input
  - Fetch toàn bộ stands từ Supabase khi mount, filter client-side theo query
  - Nhận prop `excludeId?: string` để loại Stand đã chọn bên kia khỏi danh sách
  - Hiển thị "Dữ liệu chưa sẵn sàng" nếu list trống
- [x] T014 [US1] Tạo `app/page.tsx` — trang Battle Simulator:
  - 2 instance `StandSelector` (Stand A và Stand B), mỗi cái truyền `excludeId` của cái kia
  - Nút "Bắt đầu trận đấu" — disabled nếu chưa chọn đủ 2 Stand
  - Khi bấm nút: chuyển state sang `mode: 'result'` và render `BattleResult`
  - Nút "Trận đấu mới" để reset về `mode: 'select'`
- [x] T015 [US1] Tạo `components/BattleResult.tsx`:
  - Props: `standA: Stand`, `standB: Stand`
  - Render header với tên 2 Stand và dấu "VS"
  - Placeholder sections cho chart (Phase 5) và AI explanation (Phase 6)

**Checkpoint**: MVP hoàn chỉnh — chọn 2 Stand + bắt đầu trận đấu hoạt động end-to-end.

---

## Phase 5: User Story 2 — Biểu đồ Radar so sánh 6 chỉ số (Ưu tiên: P2)

**Mục tiêu**: BattleResult hiển thị 1 RadarChart với 2 đường chồng nhau thể hiện 6 chỉ số của cả 2 Stand. Có tooltip và responsive.

**Kiểm thử độc lập**: Truyền `standA = Star Platinum` và `standB = The World` (mock data đã biết chỉ số) vào `BattleRadarChart`. Confirm 6 điểm dữ liệu render, 2 màu phân biệt, tooltip hiện đúng chữ cái (A/B/C).

- [x] T016 [P] [US2] Tạo `components/BattleRadarChart.tsx`:
  - Props: `standA: Stand`, `standB: Stand`
  - Gọi `buildRadarData(standA, standB)` từ `lib/stand-utils.ts`
  - `<RadarChart>` với 2 `<Radar>` components chồng nhau, `fillOpacity={0.35}`, màu accent `#1E5BFF` (standA) và `#FF4B4B` (standB)
  - `<Tooltip>` custom hiển thị label chỉ số + tên Stand + giá trị chữ cái gốc (A/B/C/D/E/None)
  - `<Legend>` hiển thị tên 2 Stand
  - Responsive wrapper `<ResponsiveContainer width="100%" aspect={1}>`
- [x] T017 [US2] Thay thế placeholder chart trong `components/BattleResult.tsx` bằng `<BattleRadarChart standA={standA} standB={standB} />`

**Checkpoint**: Biểu đồ Radar render đúng với dữ liệu thật từ DB — có thể so sánh trực quan.

---

## Phase 6: User Story 3 — Lý giải kết quả từ AI (Ưu tiên: P3)

**Mục tiêu**: Sau khi trận đấu bắt đầu, AI phân tích và trả về lý giải bằng tiếng Việt (~100–200 từ) kèm tên Stand thắng. Lỗi AI không ảnh hưởng đến chart đã hiển thị.

**Kiểm thử độc lập**: `POST /api/battle` với Star Platinum vs The World. Response có `explanation` (tiếng Việt, đề cập cả 2 tên Stand) và `suggestedWinner` (tên Stand hoặc `"Hòa"`).

- [x] T018 [P] [US3] Tạo `lib/battle-ai.ts`:
  - Hàm `buildBattlePrompt(req: BattleRequest): OpenAI.Chat.ChatCompletionMessageParam[]`
  - System message: định nghĩa role "chuyên gia phân tích trận đấu JoJo's Bizarre Adventure", yêu cầu output tiếng Việt 100–200 từ, format JSON `{explanation, suggestedWinner}`
  - User message: object JSON của cả 2 Stand (name, type, stats, ability_description, weakness)
- [x] T019 [P] [US3] Tạo `app/api/battle/route.ts`:
  - `export async function POST(req: Request)` — route handler Next.js App Router
  - Parse + validate `BattleRequest` từ request body (trả 400 nếu thiếu standA/standB)
  - Gọi OpenAI `chat.completions.create` với `buildBattlePrompt`, `temperature: 0.7`, `max_tokens: 400`, `response_format: { type: 'json_object' }`
  - Parse JSON response thành `BattleResponse`, trả về 200
  - Nếu lỗi: trả về 500 với `{ error: string }`
  - **Không bao giờ expose** `OPENAI_API_KEY` ra client
- [x] T020 [P] [US3] Tạo `components/AIExplanation.tsx`:
  - Props: `standA: Stand`, `standB: Stand` hoặc nhận `Promise` result
  - Loading state: hiển thị "Đang phân tích trận đấu…" với spinner
  - Success state: hiển thị `explanation` paragraph + winner badge
  - Error state: thông báo lỗi thân thiện + nút "Thử lại"
- [x] T021 [US3] Tích hợp AI flow vào `components/BattleResult.tsx`:
  - `useEffect` khi mount: `fetch('/api/battle', { method: 'POST', body: JSON.stringify({ standA, standB }) })`
  - Truyền kết quả vào `<AIExplanation />`
  - Lỗi AI phải được hiển thị riêng biệt — **không** ẩn `<BattleRadarChart>` đã render

**Checkpoint**: Full feature hoạt động: chọn Stand → chart → AI lý giải bằng tiếng Việt.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Mục tiêu**: Các cải tiến ảnh hưởng đến nhiều story.

- [x] T022 [P] Cấu hình `tailwind.config.ts`: dark mode `class`, màu custom `accent: '#1E5BFF'`, font `Anton` và `Bebas Neue`, extend spacing/typography nếu cần
- [x] T023 [P] Cấu hình `next.config.ts`: cho phép images từ domain Fandom wiki (`static.wikia.nocookie.net`) nếu có ảnh Stand User
- [ ] T024 Chạy toàn bộ flow theo `quickstart.md` trên môi trường clean: `pnpm dev` → chọn 2 Stand → xác nhận chart + AI explanation render đúng

---

## Dependencies & Thứ tự thực thi

### Phụ thuộc giữa các Phase

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← CHẶN tất cả Phase 3–7
    ↓
Phase 3 (US4 — Scraper) ← Phải có dữ liệu thật trước Phase 4–6
    ↓
Phase 4 (US1) → Phase 5 (US2) → Phase 6 (US3) ← Theo thứ tự ưu tiên
    ↓
Phase 7 (Polish)
```

### Phụ thuộc trong từng Phase

| Task                    | Phụ thuộc vào                                                    |
| ----------------------- | ---------------------------------------------------------------- |
| T009 (stand-utils)      | T006 (types/stand.ts)                                            |
| T010 (scraper-types)    | T006 (types/stand.ts)                                            |
| T011 (scraper script)   | T005 (DB schema), T007 (supabase.ts), T010 (scraper-types)       |
| T012 (chạy scraper)     | T011                                                             |
| T013 (StandSelector)    | T002 (setup), T006 (types), T007 (supabase.ts)                   |
| T014 (page.tsx)         | T013 (StandSelector), T015 (BattleResult)                        |
| T015 (BattleResult)     | T006 (types)                                                     |
| T016 (BattleRadarChart) | T009 (stand-utils), T006 (types)                                 |
| T017 (tích hợp chart)   | T016 (BattleRadarChart)                                          |
| T018 (battle-ai.ts)     | T006 (types)                                                     |
| T019 (api/battle)       | T018 (battle-ai.ts)                                              |
| T020 (AIExplanation)    | T006 (types)                                                     |
| T021 (tích hợp AI)      | T019 (api route), T020 (AIExplanation), T017 (chart đã tích hợp) |

### Có thể chạy song song

**Phase 2** (sau T001–T003 xong):

```
T004 (env.local) || T005 (DB migration) || T006 (types) || T007 (supabase) || T008 (layout)
T009 (stand-utils) [sau T006]
```

**Phase 3** (sau Phase 2):

```
T010 (scraper-types) [P] || [các task Phase 2 còn lại]
T011 → T012 [tuần tự]
```

**Phase 4** (sau Phase 2+3):

```
T013 (StandSelector) [P] || T015 (BattleResult shell) [P]
T014 (page.tsx) [sau T013 + T015]
```

**Phase 6** (sau Phase 5):

```
T018 (battle-ai) [P] || T019 (api route) [P] || T020 (AIExplanation) [P]
T021 (tích hợp) [sau cả 3 task trên + T017]
```

---

## Implementation Strategy

**MVP Scope** = Phase 1 + Phase 2 + Phase 3 + Phase 4 (T001–T015)
→ **Deliverable**: Trang chọn Stand với dữ liệu thật từ Fandom, bắt đầu trận đấu, màn hình kết quả cơ bản

**Increment 2** = Thêm Phase 5 (T016–T017)
→ **Deliverable**: Radar chart so sánh 6 chỉ số

**Full Feature** = Thêm Phase 6 (T018–T021)
→ **Deliverable**: AI analysis bằng tiếng Việt

---

## Summary

| Hạng mục                        | Số lượng |
| ------------------------------- | -------- |
| Tổng task                       | 24       |
| Phase 1 (Setup)                 | 3        |
| Phase 2 (Foundational)          | 6        |
| Phase 3 (US4 — Scraper)         | 3        |
| Phase 4 (US1 — Stand Selection) | 3        |
| Phase 5 (US2 — Radar Chart)     | 2        |
| Phase 6 (US3 — AI Explanation)  | 4        |
| Phase 7 (Polish)                | 3        |
| Tasks có thể parallel [P]       | 13       |
| MVP scope (Phase 1–4)           | 15 tasks |
