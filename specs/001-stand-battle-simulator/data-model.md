# Data Model: Stand Battle Simulator

**Phase 1 Output** — `001-stand-battle-simulator`
**Ngày**: 2026-03-26

---

## Entities

### Stand

Thực thể trung tâm — đại diện cho một Stand trong vũ trụ JoJo.

| Cột                   | Kiểu        | Ràng buộc                     | Mô tả                                |
| --------------------- | ----------- | ----------------------------- | ------------------------------------ |
| `id`                  | UUID        | PK, DEFAULT gen_random_uuid() | Khóa chính                           |
| `name`                | TEXT        | NOT NULL, UNIQUE              | Tên Stand (ví dụ: "Star Platinum")   |
| `type`                | TEXT        | NOT NULL                      | Loại Stand (xem enum bên dưới)       |
| `ability_description` | TEXT        |                               | Mô tả năng lực chính                 |
| `stats`               | JSONB       | NOT NULL, DEFAULT '{}'        | 6 chỉ số (xem schema JSONB bên dưới) |
| `weakness`            | TEXT        |                               | Điểm yếu đã biết                     |
| `scraped_at`          | TIMESTAMPTZ | DEFAULT now()                 | Thời điểm cào từ wiki                |
| `source_url`          | TEXT        |                               | URL trang wiki nguồn                 |

**Stand Type enum** (chuỗi, không phải PostgreSQL enum để dễ mở rộng):

```
'Close-Range Stand' | 'Long-Range Stand' | 'Automatic Stand' |
'Bound Stand' | 'Colony Stand' | 'Remote-Control Stand' | 'Other'
```

**Stats JSONB schema:**

```json
{
  "pow": "A", // Destructive Power
  "spd": "A", // Speed
  "rng": "C", // Range
  "dur": "A", // Persistence (Durability)
  "prc": "A", // Precision
  "dev": "A" // Development Potential
}
```

Giá trị hợp lệ: `"A" | "B" | "C" | "D" | "E" | "None"`

**Mapping sang số (dùng trong Radar chart):**

```
A → 5 | B → 4 | C → 3 | D → 2 | E → 1 | None → 0
```

---

### Character

Đại diện cho Stand User — nhân vật sở hữu Stand.

| Cột         | Kiểu     | Ràng buộc                              | Mô tả                                   |
| ----------- | -------- | -------------------------------------- | --------------------------------------- |
| `id`        | UUID     | PK, DEFAULT gen_random_uuid()          | Khóa chính                              |
| `name`      | TEXT     | NOT NULL                               | Tên nhân vật (ví dụ: "Jotaro Kujo")     |
| `stand_id`  | UUID     | FK → stands(id), ON DELETE SET NULL    | Stand của nhân vật                      |
| `part`      | SMALLINT | NOT NULL, CHECK (part BETWEEN 1 AND 9) | JoJo Part xuất hiện                     |
| `status`    | TEXT     |                                        | Trạng thái (ví dụ: "alive", "deceased") |
| `image_url` | TEXT     |                                        | URL ảnh nhân vật                        |

---

### BattleContext _(computed — không lưu DB)_

Đối tượng tạm thời được gửi từ client lên `/api/battle`.

```typescript
type BattleContext = {
  standA: Stand; // Full Stand object từ DB
  standB: Stand; // Full Stand object từ DB
};

type BattleAnalysis = {
  explanation: string; // Lý giải AI bằng tiếng Việt (100–200 từ)
  suggestedWinner: string; // Tên Stand thắng hoặc "Hòa" theo AI
};
```

---

### ScrapingReport _(transient — in-memory khi chạy script)_

```typescript
type ScrapingReport = {
  total_found: number;
  total_upserted: number;
  total_skipped: number;
  skipped_reasons: Array<{ name: string; reason: string }>;
  duration_ms: number;
};
```

---

## Relationships

```
characters (0..1) ←— stand_id —→ (1) stands
```

Một Stand có thể có nhiều Character người dùng (ví dụ: Star Platinum được dùng bởi
Jotaro Kujo ở nhiều Part), nhưng trong scope này mỗi Character chỉ liên kết 1 Stand.

---

## State Transitions

**Vòng đời Stand record:**

```
[Không tồn tại]
     ↓  scraper chạy lần đầu (INSERT)
[Exists — scraped_at = T1]
     ↓  scraper chạy lại (UPSERT theo name)
[Updated — scraped_at = T2, stats có thể khác nếu wiki cập nhật]
```

---

## Validation Rules

- `stats` JSONB PHẢI chứa đúng 6 key: `pow`, `spd`, `rng`, `dur`, `prc`, `dev`
- Mỗi giá trị stat PHẢI thuộc `["A","B","C","D","E","None"]`
- `part` PHẢI nằm trong khoảng 1–9
- `name` PHẢI là UNIQUE (dùng để upsert)

---

## Migration Scripts

### UP (apply)

```sql
-- Migration: 001_create_stands_and_characters
-- Created: 2026-03-26

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bảng stands
CREATE TABLE stands (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL,
  ability_description TEXT,
  stats               JSONB NOT NULL DEFAULT '{}',
  weakness            TEXT,
  scraped_at          TIMESTAMPTZ DEFAULT now(),
  source_url          TEXT
);

-- Bảng characters
CREATE TABLE characters (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  stand_id  UUID REFERENCES stands(id) ON DELETE SET NULL,
  part      SMALLINT NOT NULL CHECK (part BETWEEN 1 AND 9),
  status    TEXT,
  image_url TEXT
);

-- Index để tìm kiếm Stand theo tên nhanh
CREATE INDEX idx_stands_name ON stands USING gin(to_tsvector('english', name));

-- Index để lọc theo Part
CREATE INDEX idx_characters_part ON characters(part);

-- RLS: public read-only
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read stands" ON stands FOR SELECT USING (true);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read characters" ON characters FOR SELECT USING (true);
```

### DOWN (rollback)

```sql
-- Rollback: 001_create_stands_and_characters

DROP POLICY IF EXISTS "public read characters" ON characters;
DROP POLICY IF EXISTS "public read stands" ON stands;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS stands;
```

---

## Seed Data (dữ liệu mẫu cho dev/testing)

```sql
-- 2 Stand mẫu để test Battle Simulator mà không cần chạy scraper
INSERT INTO stands (name, type, ability_description, stats, weakness) VALUES
(
  'Star Platinum',
  'Close-Range Stand',
  'Sức mạnh vật lý siêu việt, tốc độ cực cao, và có khả năng dừng thời gian. Đấm liên hoàn với tiếng kêu ORA ORA ORA.',
  '{"pow":"A","spd":"A","rng":"C","dur":"A","prc":"A","dev":"A"}',
  'Phạm vi giới hạn khoảng 2m; dừng thời gian chỉ hiệu quả trong vài giây'
),
(
  'The World',
  'Close-Range Stand',
  'Có thể dừng thời gian (Za Warudo). Sức mạnh và tốc độ tương đương Star Platinum. Đã dừng thời gian lâu hơn Star Platinum.',
  '{"pow":"A","spd":"A","rng":"C","dur":"A","prc":"A","dev":"A"}',
  'Điểm yếu chí mạng ở chân; DIO cần uống máu để duy trì sức mạnh tối đa'
);

INSERT INTO characters (name, stand_id, part, status)
SELECT 'Jotaro Kujo', id, 3, 'alive' FROM stands WHERE name = 'Star Platinum';

INSERT INTO characters (name, stand_id, part, status)
SELECT 'DIO', id, 3, 'deceased' FROM stands WHERE name = 'The World';
```
