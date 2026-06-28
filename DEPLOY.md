# Panduan Deploy NXTY Fightwear ke Production

## Pilihan Platform

| Platform | Cocok untuk | Effort | Biaya |
|---|---|---|---|
| **Vercel** | Next.js (recommended) | Mudah | Free tier cukup |
| Netlify | Alternatif | Mudah | Free tier cukup |
| VPS (DigitalOcean, dll) | Full control | Lebih banyak | $5-20/bulan |

**Rekomendasi: Vercel** — dibuat oleh tim Next.js, deployment otomatis dari Git, free tier generous.

---

## A. Persiapan Local (Sebelum Deploy)

### 1. Setup Akun yang Diperlukan

- [ ] **Akun Supabase** (https://supabase.com) — gratis
- [ ] **Akun Vercel** (https://vercel.com) — gratis, bisa login dengan GitHub
- [ ] **Akun GitHub** untuk push code
- [ ] (Opsional) **Akun Everpro** (https://everpro.id) untuk shipping API

### 2. Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Catat 3 credential dari **Settings → API**:
   - `Project URL` → `SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `SUPABASE_ANON_KEY` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ JANGAN di-expose ke client
3. **Enable Email Auth** di **Authentication → Providers → Email**
4. **Buat Storage Bucket**:
   - Pergi ke **Storage**
   - Klik "New bucket"
   - Name: `product-images`, Public: ✓, klik "Create"
5. **Jalankan SQL Schema**:
   - Pergi ke **SQL Editor**
   - Copy-paste isi `supabase/schema.sql`
   - Klik "Run"
6. (Opsional) **Set Site URL** di **Authentication → URL Configuration**:
   - Site URL: `https://your-domain.vercel.app` (atau domain custom)

### 3. Setup Environment Variables

Edit file `.env.local` (sudah ada dengan dummy values):

```bash
# === Supabase ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# === Admin Auth ===
# GANTI dengan password kuat (min 16 karakter)
ADMIN_PASSWORD=YourSecurePassword123!@#

# Generate random 32+ char string: openssl rand -base64 32
ADMIN_JWT_SECRET=random-secret-string-min-32-characters-long

# === Everpro (Opsional) ===
# Daftar di everpro.id, copy API key dari dashboard
EVERPRO_API_KEY=
EVERPRO_BASE_URL=https://api.everpro.id

# === App URL (setelah deploy) ===
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. Migrate Data Awal ke Supabase

```bash
cd /home/administrator/projects/nxty-fightwear

# Install tsx jika belum
npm install -g tsx

# Jalankan migration (idempotent, aman diulang)
npx tsx scripts/migrate-data.ts
```

Output yang diharapkan:
```
✓ Migrated 13 categories
✓ Migrated 35 products (with images)
✓ Migrated 8 promotions
Migration done!
```

### 5. Test Lokal dengan Real Supabase

```bash
# Restart dev server
pkill -f "next dev" || true
sleep 2
cd /home/administrator/projects/nxty-fightwear
npm run dev
```

Test di browser:
- `http://localhost:3000` — homepage
- `http://localhost:3000/admin/login` — login admin (password dari `.env.local`)
- `http://localhost:3000/masuk` — customer login (cek email untuk OTP)

---

## B. Deploy ke Vercel

### 1. Push Code ke GitHub

```bash
cd /home/administrator/projects/nxty-fightwear

# Inisialisasi git (jika belum)
git init
git add .
git commit -m "Initial commit"

# Buat repo baru di GitHub, lalu:
git remote add origin https://github.com/YOUR_USERNAME/nxty-fightwear.git
git branch -M main
git push -u origin main
```

### 2. Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Login dengan GitHub
3. Pilih repo `nxty-fightwear` yang baru di-push
4. Configure project:
   - **Framework Preset**: Next.js (auto-detect)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
5. **JANGAN klik Deploy dulu** — klik "Environment Variables" dulu

### 3. Set Environment Variables di Vercel

Copy-paste SEMUA env vars dari `.env.local` ke Vercel dashboard. Untuk setiap variabel:
- **Key**: nama variable (mis. `SUPABASE_URL`)
- **Value**: nilainya
- **Environment**: pilih `Production`, `Preview`, dan `Development` (semua)

WAJIB di-set (Production):
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
ADMIN_PASSWORD
ADMIN_JWT_SECRET
NEXT_PUBLIC_APP_URL (set ke URL Vercel, mis. https://nxty-fightwear.vercel.app)
```

Opsional:
```
EVERPRO_API_KEY
EVERPRO_BASE_URL
```

⚠️ **PENTING**:
- `NEXT_PUBLIC_*` harus ada di Vercel karena dipakai di client-side
- `ADMIN_PASSWORD` & `ADMIN_JWT_SECRET` hanya untuk server-side
- `SUPABASE_SERVICE_ROLE_KEY` HANYA untuk server-side (admin operations)

### 4. Deploy

1. Klik **"Deploy"**
2. Tunggu build selesai (1-3 menit)
3. Jika sukses, akan muncul URL seperti `https://nxty-fightwear.vercel.app`

### 5. Update Supabase Site URL

1. Kembali ke **Supabase Dashboard**
2. **Authentication → URL Configuration**
3. Update **Site URL** ke URL Vercel: `https://nxty-fightwear.vercel.app`
4. Tambah ke **Redirect URLs**: `https://nxty-fightwear.vercel.app/auth/callback`

### 6. (Opsional) Custom Domain

Jika punya domain sendiri (mis. `nxtyfightwear.id`):

1. Di Vercel, pergi ke project → **Settings → Domains**
2. Tambah domain custom
3. Ikuti instruksi untuk setup DNS (biasanya tambah CNAME record)
4. Vercel otomatis provide SSL

Update juga `NEXT_PUBLIC_APP_URL` di Vercel ke domain custom.

---

## C. Post-Deploy Checklist

- [ ] **Test Admin Login**: Buka `https://your-domain/admin/login`, login dengan `ADMIN_PASSWORD`
- [ ] **Test Customer Login**: Buka `https://your-domain/masuk`, cek email untuk OTP
- [ ] **Test Checkout Flow**: Tambah produk ke cart → checkout → verifikasi order masuk ke Supabase
- [ ] **Test Image Upload**: Di admin, tambah produk baru dengan upload gambar, verifikasi gambar muncul di storefront
- [ ] **Setup Midtrans**: Update env vars Midtrans (`MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`) di Vercel untuk payment gateway real
- [ ] **Setup Email Templates**: Customize email templates di Supabase (Authentication → Email Templates) untuk branding

---

## D. Maintenance

### View Logs
- Vercel: Project → Logs (real-time)
- Supabase: Dashboard → Logs

### Update Code
```bash
git add .
git commit -m "Update something"
git push
```
Vercel otomatis deploy ulang (preview deployment untuk branch non-main).

### Database Backup
Supabase otomatis backup harian. Untuk manual backup:
- Supabase Dashboard → Database → Backups

### Monitoring
- Vercel Analytics (free tier): https://vercel.com/analytics
- Supabase Metrics: Dashboard → Reports

---

## E. Troubleshooting

### Build Error di Vercel
- Cek logs di Vercel
- Pastikan SEMUA env vars sudah di-set
- Cek `package.json` dependencies lengkap

### 500 Error Setelah Deploy
- Buka Vercel logs → cari error message
- Pastikan `NEXT_PUBLIC_APP_URL` di-set ke URL Vercel (bukan localhost)
- Cek Supabase Site URL match dengan domain Vercel

### Customer Login Tidak Menerima Email
- Cek Supabase → Authentication → Email Templates
- Cek spam folder
- Pastikan Site URL benar

### Image Upload Gagal
- Cek Supabase Storage bucket `product-images` ada & public
- Cek policy bucket

---

## F. Cost Estimate

| Service | Free Tier | Paid (perlu jika lewat) |
|---|---|---|
| Vercel | 100GB bandwidth/bulan, unlimited deploy | $20/bulan Pro |
| Supabase | 500MB database, 1GB storage, 50rb email/bulan | $25/bulan Pro |
| Domain (opsional) | - | $10-15/tahun |
| **Total minimum** | **$0/bulan** (cukup untuk toko baru) | Upgrade saat traffic naik |

---

**Butuh bantuan?** Tanyakan langkah mana yang kurang jelas atau ada error saat deployment.
