# Đặc tả Tính năng: Stand Battle Simulator

**Feature Branch**: `001-stand-battle-simulator`
**Ngày tạo**: 2026-03-26
**Trạng thái**: Draft
**Mô tả đầu vào**: Thiết kế tính năng Stand Battle Simulator. Mô tả luồng: Người dùng chọn 2 Stand bất kỳ từ Database -> Hệ thống so sánh chỉ số và thuộc tính -> Hiển thị biểu đồ so sánh -> Dùng AI để viết 1 đoạn mô tả ngắn về kết quả trận đấu dựa trên bối cảnh.

---

## Clarifications

### Session 2026-03-26

- Q: Bố cục biểu đồ Radar trên màn hình kết quả — 1 chart overlaid hay 2 chart song song? → A: 1 lưới lục giác duy nhất, 2 đường màu khác nhau chồng lên nhau (overlaid).
- Q: Kết quả trận đấu có được lưu vào DB không, và ai trigger? → A: Không lưu — bảng Battles loại khỏi scope, kết quả chỉ tồn tại trong session trình duyệt.
- Q: AI chỉ viết lý giải hay cũng quyết định ai thắng? → A: AI tự suy luận winner dựa trên logic năng lực từng Stand (không dùng công thức điểm số cố định); có thể tham chiếu các phân tích death battle cộng đồng đã có giữa 2 Stand.
- Q: Nguồn cào dữ liệu cụ thể là trang nào? → A: `jojo.fandom.com` (JoJo's Bizarre Encyclopedia — Fandom wiki lớn nhất, infobox Stand có bảng 6 chỉ số lục giác).
- Q: Ngôn ngữ giao diện và lý giải AI? → A: Giao diện (nhãn, nút, tên chỉ số) bằng tiếng Anh; lý giải AI bằng tiếng Việt.

---

## Kịch bản Người dùng & Kiểm thử

### User Story 1 — Chọn 2 Stand và khởi động trận đấu (Ưu tiên: P1)

Người dùng truy cập trang Battle Simulator, chọn Stand A và Stand B từ danh sách lấy
từ cơ sở dữ liệu, sau đó bấm "Bắt đầu trận đấu" để khởi động quá trình so sánh.

**Lý do ưu tiên**: Đây là bước cửa ngõ — không có bước này, mọi tính năng phía sau đều
không hoạt động.

**Kiểm thử độc lập**: Mở trang Battle Simulator, chọn 2 Stand, bấm bắt đầu. Hệ thống
chuyển trạng thái sang màn hình kết quả mà không có lỗi. Có thể kiểm thử hoàn toàn mà
không cần AI hay biểu đồ.

**Acceptance Scenarios**:

1. **Given** trang Battle Simulator đang mở, **When** người dùng mở dropdown Stand A
   và gõ tên "Star", **Then** danh sách lọc hiển thị các Stand có tên chứa "Star" (ví
   dụ: Star Platinum).
2. **Given** người dùng đã chọn Stand A, **When** người dùng mở dropdown Stand B,
   **Then** Stand A đã chọn bị loại khỏi danh sách Stand B để tránh chọn trùng.
3. **Given** cả hai Stand đã được chọn, **When** người dùng bấm "Bắt đầu trận đấu",
   **Then** hệ thống hiển thị màn hình kết quả trong vòng 3 giây (trước khi AI phản hồi).
4. **Given** chỉ 1 Stand được chọn, **When** người dùng bấm "Bắt đầu trận đấu",
   **Then** nút bị vô hiệu hóa và hiển thị thông báo yêu cầu chọn đủ 2 Stand.

---

### User Story 2 — Xem biểu đồ so sánh chỉ số 6 thuộc tính (Ưu tiên: P2)

Sau khi trận đấu khởi động, người dùng xem biểu đồ Radar song song của 2 Stand
hiển thị 6 chỉ số: Destructive Power, Speed, Range, Persistence, Precision,
Development Potential. Người dùng có thể nhận biết trực quan Stand nào mạnh hơn ở
từng chỉ số.

**Lý do ưu tiên**: Biểu đồ so sánh là giá trị cốt lõi thứ hai — cung cấp thông tin
cụ thể hơn con số kết quả thô.

**Kiểm thử độc lập**: Mock 2 Stand đã biết chỉ số (Star Platinum vs The World).
Biểu đồ Radar render đúng 6 điểm dữ liệu cho từng Stand, màu sắc phân biệt được 2
Stand, label hiển thị đúng tên chỉ số.

**Acceptance Scenarios**:

1. **Given** 2 Stand đã được chọn và trận đấu bắt đầu, **When** màn hình kết quả
   hiển thị, **Then** một biểu đồ Radar duy nhất xuất hiện với **2 đường vẽ chồng
   lên nhau** trên cùng 1 lưới lục giác, mỗi đường một màu phân biệt.
2. **Given** biểu đồ Radar đang hiển thị, **When** người dùng di chuột vào điểm dữ
   liệu trên biểu đồ, **Then** tooltip hiển thị tên chỉ số, tên Stand, và giá trị
   (A/B/C/D/E/None).
3. **Given** một Stand có chỉ số "None" ở một thuộc tính, **When** biểu đồ render,
   **Then** điểm đó được vẽ ở vị trí 0 (trung tâm) và có chú thích rõ ràng.
4. **Given** biểu đồ hiển thị, **When** người dùng xem trên màn hình di động,
   **Then** biểu đồ co giãn đúng tỷ lệ và vẫn đọc được.

---

### User Story 3 — Đọc lý giải kết quả từ AI (Ưu tiên: P3)

Người dùng đọc một đoạn mô tả ngắn (100–200 từ) do AI tạo ra, giải thích kết quả
trận đấu dựa trên bối cảnh cụ thể: chỉ số Stand, loại Stand (Type), và năng lực
đặc biệt. Người dùng hiểu tại sao Stand này thắng thay vì chỉ thấy kết quả thô.

**Lý do ưu tiên**: Đây là tính năng nâng cao — tạo sự khác biệt so với wiki thông
thường, nhưng không ảnh hưởng đến trải nghiệm cốt lõi nếu tạm vắng mặt.

**Kiểm thử độc lập**: Gọi trực tiếp hàm tạo lý giải AI với 2 bộ dữ liệu Stand đã
biết. Đầu ra phải là đoạn văn hợp lý bằng tiếng Việt, có đề cập tên 2 Stand và
ít nhất 1 lý do cụ thể dựa vào type/chỉ số.

**Acceptance Scenarios**:

1. **Given** kết quả tính toán đã hoàn tất, **When** AI đang xử lý, **Then** hiển
   thị trạng thái loading ("Đang phân tích trận đấu…") thay vì nội dung trống.
2. **Given** AI đã phản hồi, **When** đoạn mô tả xuất hiện, **Then** nội dung có
   đề cập tên của cả 2 Stand và chứa ít nhất một dẫn chứng từ chỉ số hoặc type
   (ví dụ: "với khả năng Close-range và Destructive Power A, Star Platinum …").
3. **Given** API của AI timeout hoặc trả về lỗi, **When** đoạn mô tả không thể tải,
   **Then** hệ thống hiển thị thông báo lỗi thân thiện và người dùng có thể thử lại
   mà không mất kết quả so sánh chỉ số.

---

### User Story 4 — Cào và nạp toàn bộ dữ liệu Stand vào hệ thống (Ưu tiên: P0 — Tiền đề)

Một luồng tự động thu thập toàn bộ Stand từ nguồn dữ liệu công khai (JoJo wiki),
trích xuất tên Stand, Stand User, Part, loại Stand, mô tả năng lực, và 6 chỉ số
hình lục giác (Destructive Power, Speed, Range, Persistence, Precision, Development
Potential), sau đó lưu vào cơ sở dữ liệu. Đây là điều kiện tiên quyết để Battle
Simulator có dữ liệu thực hoạt động.

**Lý do ưu tiên P0**: Không có dữ liệu Stand thực tế, toàn bộ US1–US3 chỉ hoạt
động với mock data và không có giá trị thực tế.

**Kiểm thử độc lập**: Chạy script cào trên môi trường local, kiểm tra cơ sở dữ liệu
có ít nhất 50 Stand với đầy đủ 6 chỉ số và Stand User liên kết hợp lệ.

**Acceptance Scenarios**:

1. **Given** script cào được chạy, **When** hoàn thành, **Then** cơ sở dữ liệu chứa
   toàn bộ Stand xuất hiện trong manga/anime JoJo từ Part 1 đến Part 9.
2. **Given** dữ liệu được cào, **When** kiểm tra từng Stand, **Then** mỗi Stand có
   đầy đủ 6 chỉ số hình lục giác (giá trị A/B/C/D/E/None), loại Stand, và liên kết
   tới đúng một Stand User.
3. **Given** script chạy lại lần 2, **When** dữ liệu đã tồn tại trong DB, **Then**
   script KHÔNG tạo bản ghi trùng lặp (upsert theo tên Stand).
4. **Given** một Stand trên wiki thiếu chỉ số, **When** script cào gặp trường hợp
   này, **Then** chỉ số thiếu được ghi là "None" và Stand vẫn được lưu (không bỏ
   qua toàn bộ bản ghi).
5. **Given** script hoàn thành, **When** xem báo cáo, **Then** hiển thị tổng số
   Stand đã cào thành công, số Stand bỏ qua, và lý do bỏ qua.

---

### Trường hợp Biên (Edge Cases)

- Điều gì xảy ra khi cơ sở dữ liệu trả về danh sách Stand rỗng (script cào chưa chạy)?
  → Hiển thị thông báo "Dữ liệu chưa sẵn sàng" thay vì trang trắng.
- Điều gì xảy ra khi 2 Stand có chỉ số hoàn toàn bằng nhau?
  → Kết quả trả về "Hòa" và AI giải thích theo hướng tương quan sức mạnh.
- Điều gì xảy ra khi người dùng chọn cùng một Stand cho cả A và B?
  → Phòng ngừa ở giao diện (loại trùng khỏi dropdown thứ 2) — không bao giờ
  đến được bước tính toán.
- Điều gì xảy ra khi kết nối mạng bị mất sau khi chọn Stand và trước khi nhận
  lý giải AI?
  → Kết quả tính toán (chỉ số + kết quả thô) vẫn hiển thị; lý giải AI hiển thị
  trạng thái lỗi riêng biệt với nút "Thử lại".

---

## Yêu cầu Tính năng

### Yêu cầu Chức năng

- **FR-001**: Hệ thống PHẢI cung cấp giao diện tìm kiếm và chọn Stand từ danh sách
  đầy đủ trong cơ sở dữ liệu cho cả vị trí Stand A và Stand B.
- **FR-002**: Hệ thống PHẢI ngăn người dùng chọn cùng một Stand cho cả hai vị trí.
- **FR-003**: Hệ thống PHẢI truyền cho AI toàn bộ thông tin của cả 2 Stand (6 chỉ số
  lục giác, loại Stand, mô tả năng lực, điểm yếu) để AI tự suy luận winner dựa
  trên **logic tương tác năng lực**, không dùng công thức điểm số cố định. AI
  có thể tham chiếu các phân tích death battle cộng đồng đã có giữa 2 Stand
  khi có dữ liệu.
- **FR-004**: Hệ thống PHẢI hiển thị **một biểu đồ Radar duy nhất** với 2 đường
  vẽ chồng lên nhau (overlaid) trên cùng 1 lưới lục giác 6 trục, phân biệt màu
  sắc cho từng Stand, và có tooltip chi tiết khi hover.
- **FR-005**: Hệ thống PHẢI gửi yêu cầu tới dịch vụ AI sau khi tính toán xong và
  hiển thị đoạn lý giải kết quả (100–200 từ) **bằng tiếng Việt**.
- **FR-006**: Hệ thống PHẢI hiển thị trạng thái loading trong khi chờ AI phản hồi.
- **FR-007**: Hệ thống PHẢI xử lý lỗi AI một cách đơn ý và cho phép người dùng thử
  lại lý giải mà không cần chọn lại Stand.
- **FR-008**: Hệ thống PHẢI cung cấp một luồng cào dữ liệu tự động thu thập toàn
  bộ Stand từ JoJo wiki, trích xuất đúng 6 chỉ số hình lục giác và thông tin Stand
  User, lưu vào cơ sở dữ liệu theo cơ chế upsert (không trùng lặp).
- **FR-009**: Luồng cào PHẢI tạo báo cáo sau mỗi lần chạy liệt kê số Stand thành
  công, số bỏ qua và lý do.
- **FR-010**: Hệ thống PHẢI truyền đủ dữ liệu Stand cho AI mỗi lần để kết quả có
  cơ sở suy luận rõ ràng; kết quả có thể khác nhau giữa các lần gọi (AI-
  reasoned, không deterministic) — đây là thiết kế có chủ ý.
- **FR-011**: Hệ thống KHÔNG yêu cầu đăng nhập hoặc tạo tài khoản để sử dụng bất
  kỳ tính năng nào — toàn bộ trải nghiệm hoàn toàn công khai.

### Thực thể Dữ liệu Cốt lõi

- **Stand**: `id`, `name`, `type` (Close-range | Long-range | Automatic | Bound |
  Colony), `ability_description`, `stats` (pow, spd, rng, dur, prc, dev — giá trị
  A/B/C/D/E/None), `weakness`.
- **Character**: `id`, `name`, `stand_id` (FK), `part` (1-9), `status`, `image_url`.
- **BattleContext** (computed, không lưu DB): cặp (Stand A full object, Stand B full
  object) dùng để gửi prompt cho AI và tính toán kết quả — tồn tại trong session
  trình duyệt, không được lưu xuống cơ sở dữ liệu.
- **ScrapingReport** (transient, không lưu DB): tổng số Stand cào được, số bỏ qua,
  danh sách tên Stand bị lỗi và lý do.

---

## Tiêu chí Thành công

### Kết quả Có thể Đo được

- **SC-001**: Người dùng hoàn thành luồng chọn 2 Stand → xem kết quả đầy đủ (bao
  gồm biểu đồ) trong dưới 3 giây (không tính thời gian chờ AI).
- **SC-002**: Lý giải AI xuất hiện trong vòng 10 giây kể từ khi bắt đầu trận đấu
  trong điều kiện mạng bình thường.
- **SC-003**: Kết quả AI suy luận hợp lý — mỗi kết quả phải có ít nhất 1 lý do
  cụ thể dựa trên năng lực hoặc chỉ số Stand (không đưa ra kết quả ngẫu nhiên
  không có căn cứ).
- **SC-004**: Biểu đồ Radar hiển thị đúng trên cả màn hình desktop (≥1024px) và
  mobile (≥320px) mà không có nội dung bị cắt xén.
- **SC-005**: Khi AI gặp lỗi, người dùng vẫn thấy đầy đủ kết quả so sánh chỉ số và
  biểu đồ — trải nghiệm không bị gián đoạn hoàn toàn.
- **SC-006**: Toàn bộ hệ thống (Battle Simulator + xem dữ liệu Stand) hoàn toàn
  không yêu cầu đăng nhập — không có màn hình auth nào tồn tại.
- **SC-007**: Sau khi chạy luồng cào, cơ sở dữ liệu có ít nhất 90% số Stand xuất
  hiện trên wiki chính thức (JoJo Wiki / Fandom), mỗi Stand có đủ 6 chỉ số lục giác.

---

## Giả định

- **Không có hệ thống xác thực**: Hệ thống này không có đăng nhập, đăng ký, hay
  quản lý người dùng ở bất kỳ hình thức nào — hoàn toàn nằm ngoài phạm vi.
- Nguồn cào dữ liệu là **`jojo.fandom.com`** (JoJo’s Bizarre Encyclopedia) — trang
  công khai, không yêu cầu xác thực để đọc, infobox các trang Stand chứa bảng
  6 chỉ số lục giác. Người phát triển chịu trách nhiệm tuân thủ robots.txt và
  rate limit của Fandom.
- Dịch vụ AI (LLM) đã được cấu hình sẵn API key ở cấp môi trường (environment
  variable) — tính năng này không tự quản lý key.
- **Ngôn ngữ**: Giao diện (nhãn, nút, tên chỉ số Stand) bằng **tiếng Anh** — thuật
  ngữ Stand giữ nguyên gốc từ manga. Lý giải AI bằng **tiếng Việt**.
- Công thức điểm số deterministic **không được sử dụng** — AI suy luận kết quả
  dựa trên logic năng lực, chỉ số, và tham chiếu death battle cộng đồng nếu có.
- Bảng `Battles` **không tồn tại** trong phạm vi tính năng này — kết quả trận đấu
  là tạm thời, chỉ hiển thị trong phiên trình duyệt hiện tại và không được ghi xuống
  cơ sở dữ liệu.
