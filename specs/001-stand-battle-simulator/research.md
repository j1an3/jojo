# Research: Stand Battle Simulator

**Phase 0 Output** — `001-stand-battle-simulator`
**Ngày**: 2026-03-26

---

## 1. Tích hợp Fandom MediaWiki API

**Quyết định**: Sử dụng Fandom MediaWiki API (`https://jojo.fandom.com/api.php`) thay
vì scrape HTML trực tiếp.

**Lý do**: API trả về wikitext có cấu trúc ổn định, không bị thay đổi bởi CSS/layout
của trang. Fandom hỗ trợ public read-only API không cần authentication.

**Cách thay thế đã loại bỏ**: Playwright/Puppeteer scrape HTML → quá phức tạp, dễ
vỡ khi Fandom cập nhật giao diện.

### Luồng cào dữ liệu đã xác minh

**Bước 1 — Lấy danh sách tất cả Stand:**

```
GET https://jojo.fandom.com/api.php
  ?action=query
  &list=categorymembers
  &cmtitle=Category:Stands
  &cmlimit=500
  &format=json
```

Kết quả trả về: `[{"pageid":2526,"ns":0,"title":"20th Century Boy"}, ...]`
Phân trang: sử dụng `cmcontinue` token từ response cho đến khi cạn.

**Bước 2 — Lấy wikitext của từng Stand:**

```
GET https://jojo.fandom.com/api.php
  ?action=parse
  &page=Star_Platinum
  &prop=wikitext
  &format=json
  &formatversion=2
```

**Bước 3 — Phân tích wikitext bằng regex:**

| Trường | Pattern regex                                                                                                                | Ví dụ output  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| Stats  | `\{\{Stats\|power=([A-E])\|speed=([A-E])\|range=([A-E])\|persistence=([A-E])\|precision=([A-E])\|potential=([A-E\{\}None]+)` | `A,A,C,A,A,A` |
| User   | `\|user\s*=\s*\[\[([^\]                                                                                                      | ]+)`          | `Jotaro Kujo`       |
| Type   | `\|type\s*=\s*\[\[Stand Types#[^                                                                                             | ]+\|([^\]]+)` | `Close-Range Stand` |
| Part   | `\[\[Category:Part (\d) Stands\]\]`                                                                                          | `3`           |

**Xác minh thực tế** (Star Platinum):

```
power=A|speed=A|range=C|persistence=A|precision=A|potential=A
user = [[Jotaro Kujo]]
type = [[Stand Types#Close-Range Stand|Close-Range Stand]]
[[Category:Part 3 Stands]]
```

**Lưu ý về `potential={{Null}}`**: Một số Stand có Development Potential là "None/Complete",
biểu thị bằng `{{Null}}` trong wikitext → map về chuỗi `"None"`.

### Rate limit & Compliance

- Fandom `robots.txt` cho phép crawl nhưng yêu cầu delay giữa các request
- **Quy tắc đặt ra**: delay 300ms giữa mỗi lần gọi API (tương đương ~3 req/s)
- Tổng dự kiến: ~350–400 Stand page → ~2 phút để hoàn thành toàn bộ

---

## 2. Recharts RadarChart — Overlaid 2 Stand

**Quyết định**: Sử dụng Recharts `RadarChart` với **2 `<Radar>` component** trên
cùng 1 `data` array, mỗi component có `dataKey` riêng và `fillOpacity` thấp (0.3)
để hiệu ứng trong suốt cho phép nhìn thấy cả 2 vùng.

**Lý do**: Recharts đã có trong constitution. Approach overlaid là built-in — không
cần thư viện bổ sung.

**Cách thay thế đã loại bỏ**: Chart.js RadarChart → API phức tạp hơn khi tích hợp
với Next.js App Router (cần dynamic import, canvas ref). Recharts là React-native.

### Data shape đã xác định

```typescript
// Stat value mapping: A=5, B=4, C=3, D=2, E=1, None=0
const STAT_MAP: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  None: 0,
};

type RadarDataPoint = {
  subject: string; // Axis label (e.g. "Destructive Power")
  standA: number; // 0–5
  standB: number; // 0–5
  fullMark: 5;
};

// Thứ tự trục cố định (đúng thứ tự hexagon gốc từ manga):
const AXES = [
  { key: "pow", label: "Destructive Power" },
  { key: "spd", label: "Speed" },
  { key: "rng", label: "Range" },
  { key: "dur", label: "Persistence" },
  { key: "prc", label: "Precision" },
  { key: "dev", label: "Development Potential" },
];
```

### JSX pattern

```tsx
<RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
  <PolarGrid stroke="#333" />
  <PolarAngleAxis dataKey="subject" tick={{ fill: "#fff", fontSize: 11 }} />
  <PolarRadiusAxis
    domain={[0, 5]}
    tickCount={6}
    tick={false}
    axisLine={false}
  />
  <Radar
    name={standA.name}
    dataKey="standA"
    stroke="#1E5BFF"
    fill="#1E5BFF"
    fillOpacity={0.35}
  />
  <Radar
    name={standB.name}
    dataKey="standB"
    stroke="#FF6B35"
    fill="#FF6B35"
    fillOpacity={0.35}
  />
  <Legend />
  <Tooltip />
</RadarChart>
```

---

## 3. AI Prompt Strategy — Battle Analysis

**Quyết định**: Server-side API route (`/api/battle`) nhận 2 Stand objects, cấu
trúc prompt có 2 phần:

1. **System prompt**: định nghĩa vai trò AI và JoJo universe context
2. **User prompt**: cung cấp data 2 Stand + yêu cầu phân tích tiếng Việt

**Lý do**: Xử lý server-side ẩn API key hoàn toàn khỏi client. API route là
Next.js pattern chuẩn — không cần backend riêng.

**Cách thay thế đã loại bỏ**: Client-side direct LLM call → lộ API key.

### Prompt structure đã thiết kế

```
SYSTEM:
Bạn là một chuyên gia phân tích chiến đấu Stand trong vũ trụ JoJo's Bizarre Adventure.
Nhiệm vụ của bạn là phân tích và dự đoán kết quả trận đấu giữa 2 Stand dựa trên:
- Logic tương tác của các năng lực đặc biệt
- Chỉ số 6 thuộc tính (không phải công thức điểm cố định)
- Loại Stand (Close-range, Long-range, Automatic, Bound, Colony)
- Điểm yếu đã được ghi nhận
Viết đoạn phân tích bằng TIẾNG VIỆT, 100–200 từ, có kết luận rõ ràng.

USER:
Stand A: [name]
- Type: [type]
- Stats: Power [pow], Speed [spd], Range [rng], Persistence [dur], Precision [prc], Development [dev]
- Ability: [ability_description]
- Weakness: [weakness]

Stand B: [name]
- Type: [type]
- Stats: Power [pow], Speed [spd], Range [rng], Persistence [dur], Precision [prc], Development [dev]
- Ability: [ability_description]
- Weakness: [weakness]

Phân tích kết quả trận đấu 1v1 trong điều kiện trung lập.
```

**Giới hạn token**: 400 output tokens (đủ cho 200 từ tiếng Việt).
**Temperature**: 0.7 (cho phép sáng tạo trong diễn đạt nhưng không random quá).

---

## 4. Supabase — Public Read-Only Access

**Quyết định**: Client trực tiếp query Supabase với `anon` key cho bảng `stands` và
`characters` (read-only). Không cần Row Level Security phức tạp vì không có auth.

**Lý do**: Không có dữ liệu nhạy cảm trong 2 bảng này — toàn bộ là dữ liệu công
khai từ wiki. RLS mặc định `public read` là đủ.

**Cú pháp Supabase RLS cần bật:**

```sql
-- Cho phép read public cho cả hai bảng
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON stands FOR SELECT USING (true);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON characters FOR SELECT USING (true);
```

**Script scraper** dùng `service_role` key (server-side only, không bao giờ expose
ra client) để thực hiện upsert.

---

## 5. Kết luận — Tất cả NEEDS CLARIFICATION đã giải quyết

| Điểm không rõ ban đầu   | Quyết định                                                                |
| ----------------------- | ------------------------------------------------------------------------- | ------- | --------------- |
| Cách scrape Fandom      | Dùng MediaWiki API `/api.php`, không scrape HTML                          |
| Parse stats từ wikitext | Regex trên `{{Stats                                                       | power=X | ...}}` template |
| Overlaid Radar chart    | Recharts 2x `<Radar>` trên cùng `<RadarChart>`                            |
| Stat value mapping      | A=5, B=4, C=3, D=2, E=1, None=0                                           |
| AI winner logic         | AI suy luận từ ability logic, không dùng công thức điểm                   |
| API key security        | Server-side `/api/battle` route; `service_role` key chỉ dùng trong script |
