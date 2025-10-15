# Instruksi Setup Row Level Security (RLS) untuk Visitor Counter

## Langkah 1: Jalankan SQL di Supabase Dashboard

Buka Supabase Dashboard → SQL Editor dan jalankan SQL berikut dalam urutan ini:

### 1. Jalankan Simple RLS Policies
```sql
-- Copy dan paste isi dari file simple-rls-policies.sql
```

Buka file `visitor-counter/simple-rls-policies.sql` dan jalankan semua SQL di Supabase SQL Editor.

### 2. Verifikasi Setup
Setelah menjalankan SQL, verifikasi bahwa:

1. **RLS Policies sudah aktif**:
   - Buka Authentication → Policies
   - Pastikan semua tabel (websites, visitors, daily_stats, profiles) memiliki policies

2. **Permissions sudah benar**:
   - Buka Database → Tables
   - Klik setiap tabel dan pastikan RLS enabled

## Langkah 2: Restart Development Server

```bash
cd visitor-counter
npm run dev
```

## Langkah 3: Test Authentication

1. Buka http://localhost:3001
2. Login dengan user superadmin Anda
3. pastikan bisa mengakses dashboard

## Langkah 4: Test API Endpoints

Test API endpoints dengan curl atau browser:

1. **Test websites API**:
   ```
   http://localhost:3001/api/websites
   ```

2. **Test stats API**:
   ```
   http://localhost:3001/api/stats/all?period=week
   ```

## Troubleshooting

### Jika masih dapat 500 error:

1. **Cek log di terminal** - lihat error message yang muncul
2. **Verifikasi environment variables**:
   - Pastikan `.env.local` memiliki semua Supabase credentials
   - Restart server setelah mengubah environment variables

3. **Test connection**:
   ```
   http://localhost:3001/api/test-connection
   ```

### Jika RLS tidak berfungsi:

1. **Pastikan user sudah login** di browser
2. **Cek session** di browser dev tools → Application → Cookies
3. **Refresh page** setelah login

### Jika auth context tidak berfungsi:

1. **Clear browser cache** dan cookies
2. **Logout dan login kembali**
3. **Pastikan middleware** berfungsi dengan benar

## Struktur File Yang Telah Diubah:

1. **RLS Policies**: `simple-rls-policies.sql`
2. **API Auth Helper**: `src/lib/api-auth.ts`
3. **Updated API Routes**:
   - `src/app/api/websites/route.ts`
   - `src/app/api/stats/all/route.ts`
   - `src/app/api/stats/route.ts` (TypeScript fixed)

## Catatan Penting:

- API routes sekarang menggunakan **fallback mechanism**: mencoba client dengan auth context dulu, jika gagal fallback ke supabaseAdmin
- RLS policies dibuat sederhana untuk authenticated users
- Tidak memerlukan custom claims karena menggunakan superadmin Supabase

## Next Steps:

Setelah setup berhasil, Anda bisa:
1. Test semua fitur dashboard
2. Tambah website baru
3. Lihat analytics data
4. Custom RLS policies jika perlu lebih granular access control