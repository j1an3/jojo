# 🛡️ HƯỚNG DẪN DEPLOY PRODUCTION - GITHUB PAGES

## 📋 **TỔNG QUAN**

Hệ thống bảo mật cao cho website vote nội dung kênh TikTok/YouTube, sử dụng:

- **Frontend**: GitHub Pages (static hosting)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Bảo mật**: Server-side rate limiting, RLS policies, browser fingerprinting

---

## 🚀 **BƯỚC 1: CÀI ĐẶT SUPABASE**

### 1.1. Tạo Project Supabase

1. Truy cập: https://supabase.com
2. Tạo project mới
3. Chọn region gần Việt Nam (Singapore hoặc Seoul)
4. Lưu lại:
   - `Project URL`: `https://your-project.supabase.co`
   - `anon/public key`: Cho frontend
   - `service_role key`: Cho Edge Functions (BẢO MẬT!)

### 1.2. Chạy Database Migration

1. Mở **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung file `supabase/migrations/001_production_security.sql`
3. Paste và click **Run**
4. Kiểm tra: Tables `vote_options`, `vote_logs`, `add_logs` đã được tạo

---

## 🔧 **BƯỚC 2: DEPLOY EDGE FUNCTIONS**

### 2.1. Cài đặt Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Hoặc dùng npm
npm install -g supabase
```

### 2.2. Login và Link Project

```bash
# Login
supabase login

# Link với project của bạn
cd C:\Users\User\OneDrive\Documents\VSCode\jojo
supabase link --project-ref your-project-ref
```

Tìm `project-ref` trong Project Settings > General > Reference ID

### 2.3. Deploy Functions

```bash
# Deploy tất cả functions
supabase functions deploy admin-action
supabase functions deploy vote-action
supabase functions deploy add-option
```

### 2.4. Set Environment Variables

Trong Supabase Dashboard:

1. Vào **Edge Functions** > **Settings**
2. Thêm secrets:

```
ADMIN_PASSWORD_HASH=annopro1
```

**⚠️ QUAN TRỌNG**: Đổi `annopro1` thành mật khẩu admin của bạn!

---

## 🔐 **BƯỚC 3: CẬP NHẬT FRONTEND**

### 3.1. Cập nhật Supabase URLs

Mở file `script-production.js` và `admin-production.js`, thay:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co"; // Thay bằng URL của bạn
const SUPABASE_ANON_KEY = "your-anon-key"; // Thay bằng anon key của bạn
```

### 3.2. Đổi tên file để sử dụng production version

```powershell
# Backup file cũ
Rename-Item script.js script-dev.js
Rename-Item admin.js admin-dev.js

# Sử dụng production version
Copy-Item script-production.js script.js
Copy-Item admin-production.js admin.js
```

### 3.3. Cập nhật index.html

Thêm fingerprint.js vào `<head>`:

```html
<script src="fingerprint.js"></script>
```

---

## 📦 **BƯỚC 4: DEPLOY LÊN GITHUB PAGES**

### 4.1. Tạo GitHub Repository

```bash
cd C:\Users\User\OneDrive\Documents\VSCode\jojo

git init
git add .
git commit -m "Initial commit - Production ready"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/your-username/jojo-vote.git
git branch -M main
git push -u origin main
```

### 4.2. Enable GitHub Pages

1. Vào **Settings** > **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main / (root)
4. Click **Save**

Website sẽ có tại: `https://your-username.github.io/jojo-vote/`

---

## ✅ **BƯỚC 5: KIỂM TRA BẢO MẬT**

### 5.1. Test Rate Limiting

1. **Test Vote**: Thử vote nhiều lần nhanh → Phải báo lỗi "Vui lòng đợi 5 giây"
2. **Test Add Option**: Thử thêm nhiều options nhanh → Phải báo lỗi với countdown
3. **Test Session Limit**: Thêm 6 options trong 1 giờ → Phải bị chặn

### 5.2. Test Admin Panel

1. Truy cập: `https://your-username.github.io/jojo-vote/admin.html`
2. Thử sai mật khẩu → Phải báo lỗi
3. Nhập đúng mật khẩu (annopro1 hoặc mật khẩu bạn set) → Vào được dashboard
4. Thử mark completed, delete option → Phải hoạt động

### 5.3. Kiểm tra RLS Policies

Mở Console (F12), thử:

```javascript
// Thử insert trực tiếp (PHẢI FAIL)
await supabaseClient.from("vote_options").insert({ content: "hack" });
// Kết quả: "new row violates row-level security policy"

// Thử xóa trực tiếp (PHẢI FAIL)
await supabaseClient.from("vote_options").delete().eq("id", 1);
// Kết quả: "delete violates row-level security policy"
```

✅ Nếu cả 2 lệnh trên đều **FAIL** → Bảo mật hoạt động tốt!

---

## 🔒 **CHECKLIST BẢO MẬT**

- [ ] ✅ Database RLS policies đã enable
- [ ] ✅ Chỉ có Edge Functions có thể INSERT/UPDATE/DELETE
- [ ] ✅ Admin password đã đổi khỏi default
- [ ] ✅ Service role key KHÔNG có trong frontend code
- [ ] ✅ Rate limiting hoạt động (vote + add)
- [ ] ✅ Browser fingerprinting hoạt động
- [ ] ✅ Admin panel yêu cầu password
- [ ] ✅ Toast notifications hiển thị đúng errors

---

## 🎯 **CÁI GÌ ĐÃ THAY ĐỔI?**

### Version Cũ (Development)

- ❌ Client có thể INSERT/UPDATE/DELETE trực tiếp database
- ❌ Mật khẩu admin hardcoded trong frontend
- ❌ Anti-spam chỉ có client-side (dễ bypass)
- ❌ Không có IP tracking
- ❌ RLS policies cho phép tất cả

### Version Mới (Production)

- ✅ Tất cả thao tác database qua Edge Functions
- ✅ Edge Functions xác thực admin password
- ✅ Server-side rate limiting với IP + fingerprint
- ✅ RLS policies chỉ cho phép READ
- ✅ Logs lưu IP, fingerprint, timestamp
- ✅ Session management an toàn

---

## 🛠️ **TROUBLESHOOTING**

### Lỗi: "Edge Function not found"

```bash
# Kiểm tra functions đã deploy
supabase functions list

# Deploy lại
supabase functions deploy admin-action
```

### Lỗi: "Unauthorized" khi vote/add

- Kiểm tra `SUPABASE_ANON_KEY` đã đúng chưa
- Kiểm tra CORS headers trong Edge Functions

### Lỗi: Admin password không đúng

- Kiểm tra environment variable `ADMIN_PASSWORD_HASH` trong Supabase
- Thử login lại với mật khẩu đã set

### Vote/Add không hoạt động

- Mở Console (F12) → Network tab
- Kiểm tra requests tới Edge Functions
- Xem response errors

---

## 📊 **MONITORING**

### Xem Logs của Edge Functions

1. Vào **Edge Functions** trong Supabase Dashboard
2. Click vào function (admin-action, vote-action, add-option)
3. Xem **Logs** tab

### Kiểm tra Rate Limit Logs

```sql
-- Xem votes gần đây
SELECT * FROM vote_logs
ORDER BY voted_at DESC
LIMIT 50;

-- Xem adds gần đây
SELECT * FROM add_logs
ORDER BY added_at DESC
LIMIT 50;

-- Xem IP vote nhiều nhất
SELECT ip, COUNT(*) as vote_count
FROM vote_logs
GROUP BY ip
ORDER BY vote_count DESC;
```

---

## 🔄 **MAINTENANCE**

### Dọn dẹp logs cũ (chạy hàng tuần)

```sql
-- Xóa vote logs > 7 ngày
DELETE FROM vote_logs
WHERE voted_at < NOW() - INTERVAL '7 days';

-- Xóa add logs > 7 ngày
DELETE FROM add_logs
WHERE added_at < NOW() - INTERVAL '7 days';
```

### Backup Database

```bash
# Export database
supabase db dump > backup_$(date +%Y%m%d).sql
```

---

## 🎉 **DONE!**

Website của bạn giờ đã:

- ✅ **An toàn** với server-side validation
- ✅ **Chống spam** với rate limiting nghiêm ngặt
- ✅ **Bảo vệ admin** với password authentication
- ✅ **Production-ready** cho TikTok/YouTube channel

**URL Demo**: https://your-username.github.io/jojo-vote/
**Admin Panel**: https://your-username.github.io/jojo-vote/admin.html

**ORA ORA ORA! ゴゴゴゴ**
