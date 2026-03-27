<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A — document newly created
Added sections:
  - Core Principles (6 principles)
  - Technology Stack
  - Core Data Schema
  - Communication & Code Quality
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check gate list derived from principles below)
  - .specify/templates/spec-template.md ✅ no structural changes required
  - .specify/templates/tasks-template.md ✅ no structural changes required
Follow-up TODOs: None — all fields resolved on initial ratification.
-->

# JoJo's Bizarre Encyclopedia — Constitution

## Core Principles

### I. Manga-Style Visual Design (NON-NEGOTIABLE)

Toàn bộ giao diện người dùng PHẢI tuân thủ phong cách Dark Mode với nền tối (#0A0A0A
hoặc tương đương), font chữ góc cạnh (Anton, Bebas Neue, Impact), và đổ bóng gắt
theo phong cách manga. Biểu đồ Radar (Radar Chart) là chuẩn hiển thị bắt buộc cho
6 chỉ số Stand: Destructive Power, Speed, Range, Persistence, Precision,
Development Potential. Không được triển khai biểu đồ dạng khác (bar, pie, line)
cho phần hiển thị chỉ số Stand.

**Rationale**: Nhất quán thẩm mỹ tạo ra nhận diện thương hiệu mạnh và phù hợp với
đối tượng người dùng là fan JoJo — những người kỳ vọng giao diện trung thành với
nguồn gốc manga.

### II. Data Accuracy & Classification (NON-NEGOTIABLE)

Mọi dữ liệu Stand và Character PHẢI được phân loại theo Part (Part 1 đến Part 9).
Mỗi bản ghi Stand PHẢI liên kết tới đúng một Stand User thông qua khóa ngoại (`stand_id`
trong bảng Characters). Dữ liệu không có liên kết User hợp lệ KHÔNG ĐƯỢC phép tồn
tại trong cơ sở dữ liệu. Mọi thay đổi về stats hoặc phân loại PHẢI có nguồn tham
chiếu từ manga/anime chính thức.

**Rationale**: Tính chính xác là giá trị cốt lõi của một nền tảng Wiki. Dữ liệu sai
hoặc mồ côi làm mất tin tưởng của cộng đồng fan.

### III. Battle Simulator Logic (NON-NEGOTIABLE)

Hệ thống Battle Simulator PHẢI tính đến thuộc tính loại Stand (Type: Close-range,
Long-range, Automatic, Bound, Colony) trong công thức tính kết quả — không được
chỉ so sánh chỉ số thô (A/B/C/D/E/None). Mỗi kết quả giả lập PHẢI sinh ra một
lý giải ngôn ngữ tự nhiên (thông qua LLM) giải thích tại sao một Stand thắng
trong điều kiện cụ thể. Logic battle PHẢI nhất quán và tái lập được
(same inputs → same deterministic base outcome trước khi có yếu tố ngẫu nhiên).

**Rationale**: Battle Simulator là tính năng phân biệt sản phẩm này với các Wiki
tĩnh. Logic nông (chỉ so số) sẽ bị cộng đồng bác bỏ ngay lập tức.

### IV. Technology Stack Compliance (NON-NEGOTIABLE)

Stack được phê duyệt và KHÔNG được thay thế mà không có quyết định sửa đổi constitution:

- **Frontend**: Next.js 14+ với App Router; Tailwind CSS
- **UI Components**: Shadcn/UI + Lucide Icons
- **Charts**: Recharts hoặc Chart.js (không dùng D3 trực tiếp)
- **Backend/Database**: Supabase (PostgreSQL + Auth tích hợp)
- **AI Integration**: LLM (OpenAI / compatible) để giải thích kết quả Battle Simulator

Mọi dependency mới thêm vào PHẢI không xung đột với stack trên và được ghi rõ lý
do trong plan.md của feature tương ứng.

**Rationale**: Tính nhất quán stack giảm chi phí onboarding, tối ưu SEO (Next.js SSR),
và tận dụng Supabase RLS để bảo vệ dữ liệu người dùng.

### V. Core Data Schema Integrity (NON-NEGOTIABLE)

Ba bảng cốt lõi sau là bất biến về tên và trách nhiệm — chỉ được mở rộng (thêm
cột), không được xóa hay đổi tên mà không có migration rõ ràng và version bump:

- **Characters**: `id`, `name`, `stand_id` (FK → Stands), `part` (1-9), `status`,
  `image_url`
- **Stands**: `id`, `name`, `type` (Close-range | Long-range | Automatic | Bound |
  Colony), `ability_description`, `stats` (JSONB: pow, spd, rng, dur, prc, dev),
  `weakness`
- **Battles**: `id`, `stand_a_id`, `stand_b_id`, `result`, `explanation`,
  `created_at`, `created_by`

Mọi schema migration PHẢI đi kèm rollback script.

**Rationale**: Schema ổn định cho phép tính năng Battle Log và community voting
được xây dựng song song mà không bị phá vỡ bởi thay đổi nền tảng.

### VI. Communication & Code Quality (NON-NEGOTIABLE)

Toàn bộ tài liệu Đặc tả (spec.md), Kế hoạch (plan.md), và Danh sách nhiệm vụ
(tasks.md) PHẢI viết bằng **tiếng Việt**. Code comments PHẢI rõ ràng, tuân thủ
Clean Code (không dư thừa, không lỗi thời). Tên biến/hàm/component PHẢI bằng
tiếng Anh (code-level). Commit messages PHẢI theo Conventional Commits
(`feat:`, `fix:`, `docs:`, `chore:`, v.v.).

### VII. Human-in-the-Loop Process (NON-NEGOTIABLE)

AI (Agent) TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý thực thi mã nguồn (implement) ngay sau khi nhận yêu cầu mới. Quy trình bắt buộc phải tuân thủ các điểm dừng (Checkpoints) sau:

1. **Clarify First**: Sau khi nhận yêu cầu, AI phải chạy `/speckit.clarify` để đưa ra ít nhất 3-5 câu hỏi làm rõ logic, giao diện hoặc các trường hợp biên (edge cases).
2. **Plan Approval**: AI phải trình bày bản kế hoạch `/speckit.plan` chi tiết (liệt kê các file sẽ sửa, logic thay đổi) và CHỜ xác nhận "Approve" từ người dùng.
3. **No Auto-Run**: Cấm mọi hành vi tự động băm nhỏ task và thực thi (implement) khi chưa có sự đồng ý tường minh cho bản kế hoạch đó.

**Rationale**: Đảm bảo người dùng (Jian) giữ quyền kiểm soát 100% đối với kiến trúc hệ thống, tránh việc AI tự ý sinh code rác hoặc làm sai lệch phong cách JoJo đặc trưng.

## Technology Stack

| Layer                | Công nghệ                    | Phiên bản tối thiểu |
| -------------------- | ---------------------------- | ------------------- |
| Frontend Framework   | Next.js (App Router)         | 14.0                |
| Styling              | Tailwind CSS                 | 3.4                 |
| UI Components        | Shadcn/UI + Lucide Icons     | latest stable       |
| Charts               | Recharts hoặc Chart.js       | 2.x                 |
| Backend-as-a-Service | Supabase (PostgreSQL + Auth) | latest              |
| AI / LLM             | OpenAI API hoặc compatible   | GPT-4o / compatible |
| Language             | TypeScript                   | 5.x                 |
| Package Manager      | pnpm                         | 8+                  |

## Core Data Schema

```sql
-- Characters: nhân vật và Stand User
CREATE TABLE characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  stand_id    UUID REFERENCES stands(id),
  part        SMALLINT NOT NULL CHECK (part BETWEEN 1 AND 9),
  status      TEXT,           -- e.g. 'alive', 'deceased'
  image_url   TEXT
);

-- Stands: Stand và chỉ số
CREATE TABLE stands (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  type                TEXT NOT NULL,  -- Close-range | Long-range | Automatic | Bound | Colony
  ability_description TEXT,
  stats               JSONB NOT NULL, -- {pow, spd, rng, dur, prc, dev}: values A-E/None
  weakness            TEXT
);

-- Battles: log giả lập chiến đấu
CREATE TABLE battles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_a_id  UUID NOT NULL REFERENCES stands(id),
  stand_b_id  UUID NOT NULL REFERENCES stands(id),
  result      TEXT NOT NULL,    -- 'stand_a' | 'stand_b' | 'draw'
  explanation TEXT,             -- LLM-generated rationale
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id)
);
```

## Communication & Code Quality

- **Tài liệu dự án** (spec, plan, tasks): viết hoàn toàn bằng tiếng Việt.
- **Code** (biến, hàm, component, API routes): viết bằng tiếng Anh.
- **Commit messages**: theo chuẩn Conventional Commits.
- **Code review**: mọi PR PHẢI pass lint + type-check trước khi merge.
- **Comments**: chỉ viết khi logic không tự giải thích được; không comment rõ ràng.

## Governance

Constitution này có hiệu lực cao nhất trong dự án. Mọi quyết định kỹ thuật
mâu thuẫn với các nguyên tắc trên PHẢI được giải quyết bằng cách sửa đổi
Constitution trước, sau đó mới triển khai.

**Quy trình sửa đổi**:

1. Mở issue trình bày lý do thay đổi và nguyên tắc bị ảnh hưởng.
2. Cập nhật `constitution.md` với nội dung mới + bump version (SemVer).
3. Cập nhật Sync Impact Report ở đầu file.
4. Kiểm tra và cập nhật các template bị ảnh hưởng.
5. Commit với message: `docs: amend constitution to vX.Y.Z (<summary>)`.

**Versioning Policy**:

- MAJOR: Xóa hoặc định nghĩa lại một nguyên tắc theo hướng không tương thích.
- MINOR: Thêm nguyên tắc mới hoặc mở rộng đáng kể nội dung hiện có.
- PATCH: Làm rõ câu chữ, sửa lỗi chính tả, cải thiện ví dụ.

**Compliance Review**: Mỗi plan.md mới PHẢI có mục "Constitution Check" xác nhận
tuân thủ tất cả 6 nguyên tắc trước khi bắt đầu Phase 0.

**Version**: 1.1.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-27
