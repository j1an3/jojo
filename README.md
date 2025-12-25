# JoJo's Bizarre Links - Hướng dẫn chạy

## Chuẩn bị

1. **Đặt file ảnh avt.png** vào thư mục này (cùng với index.html)

2. **Cấu hình Supabase** (đã hoàn thành ✓)
   - URL và ANON_KEY đã được nhập vào script.js

## Cách chạy website

### Bước 1: Khởi động server local

Mở terminal trong thư mục này và chạy một trong các lệnh sau:

**Với Python:**

```bash
python -m http.server 8000
```

**Hoặc với Live Server trong VS Code:**

- Cài extension "Live Server"
- Bấm chuột phải vào index.html → "Open with Live Server"

### Bước 2: Khắc phục lỗi Tracking Prevention

Khi mở website, bạn sẽ thấy lỗi:

```
Tracking Prevention blocked access to storage for https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
```

**Cách sửa:**

#### Trên Microsoft Edge:

1. Nhìn vào thanh địa chỉ, bấm vào biểu tượng **khiên/shield** 🛡️
2. Chọn **"Allow"** hoặc **"Cho phép"**
3. Tải lại trang (F5)

#### Hoặc dùng trình duyệt khác:

- Chrome
- Firefox
- Brave

#### Hoặc tắt Enhanced Tracking Prevention:

1. Edge: Settings → Privacy, search, and services → Tracking prevention → Chọn "Basic"
2. Chrome: Không cần tắt, thường không chặn

### Bước 3: Mở website

Truy cập: **http://localhost:8000**

## Cấu hình Supabase (Quan trọng!)

Để website hoạt động, bạn cần:

### 1. Tạo bảng `vote_options` (Cập nhật với completed fields)

Chạy SQL sau trong Supabase SQL Editor:

```sql
create table vote_options (
  id bigserial primary key,
  content text not null,
  vote_count int4 default 0,
  completed boolean default false,
  completed_at timestamptz
);
```

**Nếu bạn đã tạo bảng rồi, chạy lệnh ALTER để thêm cột:**

```sql
alter table vote_options
  add column if not exists completed boolean default false,
  add column if not exists completed_at timestamptz;
```

### 2. Bật RLS và tạo Policy

```sql
-- Bật Row Level Security
alter table vote_options enable row level security;

-- Cho phép mọi người xem
create policy "Allow select for all"
on vote_options for select
using (true);

-- Cho phép mọi người thêm
create policy "Allow insert for all"
on vote_options for insert
with check (true);

-- Cho phép mọi người cập nhật (vote)
create policy "Allow update for all"
on vote_options for update
using (true);

-- Cho phép xóa (dùng cho admin)
create policy "Allow delete for all"
on vote_options for delete
using (true);
```

### 3. Thêm dữ liệu mẫu (tùy chọn)

```sql
insert into vote_options (content, vote_count, completed) values
  ('Lịch sử JoJo Part 1', 0, false),
  ('Review Stand mạnh nhất', 0, false),
  ('Giải thích Hamon vs Stand', 0, false),
  ('Top 10 trận đấu JoJo', 0, true);
```

## Trang Admin

### Truy cập Admin Panel

1. Mở: **http://localhost:8000/admin.html**
2. Nhập mật khẩu: **jojo2023** (mặc định)

### Tính năng Admin

- ✅ **Đánh dấu hoàn thành**: Đánh dấu nội dung đã làm xong
- 🔄 **Chuyển về chưa làm**: Bỏ đánh dấu hoàn thành
- 🗑️ **Xóa nội dung**: Xóa option khỏi danh sách
- 📊 **Xem thống kê**: Tổng số, đã hoàn thành, đang chờ, tổng votes

### Đổi mật khẩu Admin

Mở file `admin.js`, tìm dòng:

```javascript
const ADMIN_PASSWORD = "jojo2023"; // Change this!
```

Đổi `'jojo2023'` thành mật khẩu mới của bạn.

## Troubleshooting

### Không hiện danh sách Stand?

- Kiểm tra Console (F12) xem có lỗi gì
- Đảm bảo đã tạo bảng và policy đúng trên Supabase
- Kiểm tra URL và ANON_KEY trong script.js

### Lỗi CORS?

- Chạy bằng server local (http-server, Live Server, python -m http.server)
- KHÔNG mở file trực tiếp bằng file:/// protocol

### Lỗi "Identifier 'supabase' has already been declared"?

- Xóa cache trình duyệt (Ctrl + Shift + Delete)
- Tải lại trang (Ctrl + F5 - hard reload)

## Deploy lên GitHub Pages

1. Tạo repository trên GitHub
2. Push code lên repo
3. Settings → Pages → Source: main branch
4. Website sẽ có địa chỉ: `https://username.github.io/repo-name/`

**Lưu ý:** Supabase hoạt động tốt với GitHub Pages vì dùng CDN.

---

🌟 **ORA ORA! Stand Battle bắt đầu!** ゴゴゴゴ
