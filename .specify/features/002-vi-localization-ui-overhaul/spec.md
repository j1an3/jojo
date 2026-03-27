# Feature Specification: VI Localization, UI Overhaul & Mobile Unification

**Feature Branch**: `002-vi-localization-ui-overhaul`
**Created**: 2026-03-27
**Status**: Clarified — Awaiting Plan Approval
**Input**: "ở các trang khác chưa có nút quay về index, các năng lực của stand chưa dc việt hóa thuần việt, giao diện khó nhìn, chưa thống nhất cho mobile nữa / scrape năng lực stand từ wiki tiếng việt (ưu tiên) hoặc dùng api groq có sẵn để dịch"

## Clarifications

### Session 2026-03-27

- Q: Kiến trúc lưu trữ bản dịch tiếng Việt? → A: Option A — Thêm cột `ability_description_vi` + `weakness_vi` vào bảng `stands` trong Supabase
- Q: Nguồn dữ liệu tiếng Việt cho scraper? → A: Option C — Scrape `jojo.fandom.com/vi` trước, Groq fallback nếu trang VI không tồn tại hoặc trống
- Q: Phạm vi cải thiện UI/Mobile? → A: Option A — Tất cả 4 trang: `/stands`, `/characters`, `/family-tree`, `/battle`
- Q: Hành vi nút EN/VI sau khi data có trong DB? → A: Option A — Fetch EN+VI cùng 1 lần, toggle instant (0ms latency, không lazy load)
- Q: Fallback UI khi `ability_description_vi` = null? → A: Option B — Ẩn hoàn toàn nút VI, chỉ hiện khi `ability_description_vi != null`

---

## User Scenarios & Testing

### User Story 1 — Đọc năng lực Stand bằng tiếng Việt (Priority: P1)

Fan JoJo Việt Nam mở modal Stand bất kỳ và thấy ngay bản mô tả năng lực bằng tiếng Việt, không cần bấm thêm nút hoặc đợi API.

**Why this priority**: Đây là lý do chính của feature — người dùng VI không đọc được EN.

**Independent Test**: Mở modal "Star Platinum" → kiểm tra trường `ability_description_vi` hiển thị tiếng Việt; nút VI (nếu có) toggle instant không có spinner.

**Acceptance Scenarios**:

1. **Given** DB có `ability_description_vi` cho stand, **When** user mở Stand modal, **Then** cả text EN và VI đều đã có sẵn, toggle EN/VI instant không reload
2. **Given** `ability_description_vi = null`, **When** user mở Stand modal, **Then** chỉ hiển thị EN, không có nút VI
3. **Given** `weakness_vi` có data, **When** user toggle sang VI, **Then** cả ability lẫn weakness đều hiển thị tiếng Việt

---

### User Story 2 — Scraper tự động điền VI vào DB (Priority: P1)

Dev chạy một script để tự động lấy bản dịch VI cho tất cả stands và upsert vào Supabase.

**Why this priority**: Không có data thì UI feature P1 không có gì để hiển thị.

**Independent Test**: Chạy `pnpm tsx scripts/scraper/scrape-vi-stands.ts` → kiểm tra Supabase: ít nhất 80% stands có `ability_description_vi` không null.

**Acceptance Scenarios**:

1. **Given** stand có trang VI trên jojo.fandom.com/vi, **When** scraper chạy, **Then** `ability_description_vi` được populate từ VI wiki
2. **Given** stand không có trang VI (hoặc trang trống), **When** scraper chạy, **Then** Groq được gọi để dịch `ability_description` EN → VI, kết quả upsert vào DB
3. **Given** Groq API fail, **When** scraper chạy, **Then** stand đó bị skip, log warning, scraper tiếp tục stands còn lại

---

### User Story 3 — Nút "Về Trang Chủ" trên tất cả trang (Priority: P2)

User đang ở `/stands`, `/characters`, `/family-tree`, hoặc `/battle` có thể quay về index `/` bằng 1 click.

**Why this priority**: Navigation cơ bản — navbar đã có nhưng item "Về Tôi" đã được thêm trước đó; cần xác nhận consistent trên mobile.

**Independent Test**: Mở `/stands` trên mobile (375px) → tìm nút/link dẫn về `/` → click → về homepage.

**Acceptance Scenarios**:

1. **Given** user ở bất kỳ trang nào trong 4 trang, **When** tap navbar item "Về Tôi", **Then** điều hướng về `/`
2. **Given** mobile viewport (≤640px), **When** mở hamburger menu, **Then** "Về Tôi" hiển thị rõ ràng

---

### User Story 4 — Giao diện Mobile thống nhất (Priority: P2)

Tất cả 4 trang hiển thị đúng trên màn hình 375px: không bị overflow, text đọc được, touch target ≥44px.

**Why this priority**: UX cơ bản theo standard mobile accessibility.

**Independent Test**: Mở từng trang trên DevTools mobile 375px — không có horizontal scroll ngoài ý muốn, không text bị cắt.

**Acceptance Scenarios**:

1. **Given** `/stands` modal mở trên 375px, **When** user scroll, **Then** toàn bộ nội dung hiển thị đúng, stat pills không overflow
2. **Given** `/characters` trên 375px, **When** user lọc theo Part, **Then** filter strip scroll ngang mượt
3. **Given** `/battle` trên 375px, **When** user chọn 2 stands, **Then** layout không bị vỡ
4. **Given** `/family-tree` trên 375px, **When** trang load, **Then** tree hiển thị hoặc có scroll indicator rõ ràng

---

### Edge Cases

- Stand có `ability_description` = null trong DB — scraper bỏ qua, không gọi Groq
- Trang VI wiki tồn tại nhưng section "Năng lực" trống — fallback sang Groq
- Groq trả về text quá ngắn (<20 ký tự) — coi như fail, upsert null, log warning
- Groq rate limit hit giữa chừng — dừng, log đã xử lý bao nhiêu stands, exit 0

---

## Requirements

### Functional Requirements

- **FR-001**: Bảng `stands` PHẢI có thêm 2 cột: `ability_description_vi TEXT` và `weakness_vi TEXT` (nullable)
- **FR-002**: Script `scripts/scraper/scrape-vi-stands.ts` PHẢI scrape `jojo.fandom.com/vi` và upsert `ability_description_vi`, `weakness_vi`
- **FR-003**: Nếu VI wiki trống/không tồn tại, script PHẢI gọi Groq API để dịch EN → VI
- **FR-004**: Stand modal PHẢI fetch cả `ability_description_vi` và `weakness_vi` cùng với data EN trong cùng 1 Supabase query
- **FR-005**: Nút VI PHẢI ẩn nếu `ability_description_vi = null`; chỉ hiển thị khi data có sẵn
- **FR-006**: Toggle EN/VI PHẢI là instant (không spinner, không re-fetch sau lần đầu load modal)
- **FR-007**: Tất cả 4 trang PHẢI hiển thị đúng trên viewport 375px (no unintended overflow)
- **FR-008**: Navbar PHẢI có item "Về Tôi" link đến `/` — đã implement, cần verify trên mobile

### Key Entities

- **Stand** (DB): Mở rộng thêm `ability_description_vi TEXT`, `weakness_vi TEXT`
- **VIScraper**: Script Node.js mới tại `scripts/scraper/scrape-vi-stands.ts`
- **Groq Client**: Server-side util tại `lib/groq.ts` (reuse `GROQ_API_KEY` từ `.env.local`)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: ≥80% stands có `ability_description_vi` không null sau khi scraper chạy 1 lần
- **SC-002**: Toggle EN/VI trong Stand modal hoàn thành trong <16ms (1 frame) — không có network call
- **SC-003**: Tất cả 4 trang không có horizontal overflow trên 375px viewport (kiểm tra bằng Chrome DevTools)
- **SC-004**: `npx tsc --noEmit` clean sau khi implement

---

## Assumptions

- `GROQ_API_KEY` đã được cấu hình trong `.env.local`
- `jojo.fandom.com/vi` có tên trang trùng với tên Stand EN (hoặc có redirect) — cần verify trong plan step
- Schema Supabase có thể ALTER TABLE trực tiếp (không cần migration tool ngoài)
- Groq model được dùng: `llama3-70b-8192` (hoặc tương đương available trong account)
