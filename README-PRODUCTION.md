# JoJo Vote - Hệ thống Vote Nội Dung cho Kênh TikTok/YouTube

[![Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-success)](https://pages.github.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com)
[![Security](https://img.shields.io/badge/Security-Production%20Ready-blue)](DEPLOY.md)

Website vote nội dung với phong cách JoJo's Bizarre Adventure, được xây dựng với bảo mật cấp cao cho kênh TikTok/YouTube.

## ✨ **Tính năng**

### 🗳️ **Voting System**

- Vote nội dung yêu thích
- Real-time ranking theo số vote
- Rate limiting: 5 giây cooldown, 1 vote/option/24h

### 📝 **Content Suggestion**

- Đề xuất nội dung mới
- Rate limiting: 10 giây cooldown, max 5/giờ
- Duplicate detection (case-insensitive)

### 👨‍💼 **Admin Panel**

- Dashboard với thống kê
- Đánh dấu nội dung đã hoàn thành
- Xóa nội dung không phù hợp
- Password protected

### 🛡️ **Security Features**

- Server-side rate limiting
- Browser fingerprinting
- IP tracking
- Row Level Security (RLS)
- SQL injection protection
- XSS prevention

## 🚀 **Tech Stack**

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: GitHub Pages (static)
- **Backend**: Supabase
  - PostgreSQL database
  - Edge Functions (Deno)
  - Row Level Security
- **Security**: Browser Fingerprinting, Rate Limiting

## 📦 **Deploy**

Xem hướng dẫn chi tiết trong [DEPLOY.md](DEPLOY.md)

### Quick Start

```bash
# 1. Clone repo
git clone https://github.com/your-username/jojo-vote.git
cd jojo-vote

# 2. Setup Supabase
# - Tạo project tại supabase.com
# - Chạy SQL trong supabase/migrations/001_production_security.sql

# 3. Deploy Edge Functions
supabase login
supabase link --project-ref your-ref
supabase functions deploy admin-action
supabase functions deploy vote-action
supabase functions deploy add-option

# 4. Update config
# - Sửa SUPABASE_URL và SUPABASE_ANON_KEY trong script-production.js
# - Set ADMIN_PASSWORD_HASH trong Supabase Edge Functions secrets

# 5. Deploy to GitHub Pages
git push origin main
# Enable Pages trong Settings > Pages
```

## 📁 **File Structure**

```
jojo/
├── index.html              # Trang chính
├── admin.html              # Admin panel
├── style.css               # Styles với JoJo theme
├── script.js               # Development version
├── script-production.js    # Production version (dùng Edge Functions)
├── admin.js                # Admin script (dev)
├── admin-production.js     # Admin script (production)
├── fingerprint.js          # Browser fingerprinting
├── README.md               # File này
├── DEPLOY.md               # Hướng dẫn deploy
├── .gitignore              # Git ignore
├── .env.example            # Environment variables mẫu
└── supabase/
    ├── functions/
    │   ├── admin-action/   # Admin operations
    │   ├── vote-action/    # Voting logic
    │   └── add-option/     # Add content logic
    └── migrations/
        └── 001_production_security.sql  # Database setup
```

## 🔐 **Security**

### Client-Side

- ✅ XSS prevention với HTML escaping
- ✅ Input validation
- ✅ HTTPS only
- ✅ Browser fingerprinting

### Server-Side

- ✅ Row Level Security (RLS)
- ✅ Rate limiting với IP + fingerprint
- ✅ SQL injection protection (Supabase SDK)
- ✅ Admin authentication
- ✅ Service role key không exposed

### Rate Limits

| Action        | Cooldown | Session Limit     |
| ------------- | -------- | ----------------- |
| Vote          | 5 giây   | 1 vote/option/24h |
| Add Option    | 10 giây  | 5 options/giờ     |
| Admin Actions | N/A      | Password required |

## 🎨 **Theme**

Website sử dụng theme JoJo's Bizarre Adventure với:

- 🎨 Color palette: Purple (#9b4dff), Gold (#ffd700), Pink (#ff4d94)
- 🔤 Fonts: Orbitron (headers), Rajdhani (body)
- ✨ Effects: Glass morphism, cyberpunk gradients
- 🔊 Language: Vietnamese với JoJo catchphrases (ORA ORA, MUDA, ゴゴゴ)

## 📊 **Monitoring**

### Xem logs trong Supabase Dashboard:

- Edge Functions > Logs
- SQL Editor:

  ```sql
  -- Vote logs
  SELECT * FROM vote_logs ORDER BY voted_at DESC LIMIT 50;

  -- Add logs
  SELECT * FROM add_logs ORDER BY added_at DESC LIMIT 50;
  ```

### Thống kê:

```sql
-- Top IPs
SELECT ip, COUNT(*) FROM vote_logs GROUP BY ip ORDER BY COUNT(*) DESC;

-- Vote count by day
SELECT DATE(voted_at), COUNT(*) FROM vote_logs GROUP BY DATE(voted_at);
```

## 🛠️ **Development**

### Local Development

```bash
# Sử dụng Live Server hoặc
python -m http.server 8000

# Truy cập: http://localhost:8000
```

### Testing

- Chrome DevTools (F12) → Network tab
- Responsive mode (Ctrl+Shift+M)
- Console để xem errors

## 📝 **License**

MIT License - Free to use cho personal và commercial projects.

## 🤝 **Contributing**

Pull requests welcome! Đối với major changes, vui lòng mở issue trước.

## 📧 **Contact**

- TikTok: [@your-tiktok]
- YouTube: [Your Channel]
- GitHub: [your-username]

## 🎉 **Credits**

- Design inspired by JoJo's Bizarre Adventure
- Built with ❤️ for TikTok/YouTube community

---

**ORA ORA ORA! ゴゴゴゴ**
