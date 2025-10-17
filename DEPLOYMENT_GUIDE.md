# Deployment Guide for Visitor Counter

## Quick Deployment

Setelah melakukan `git pull`, jalankan perintah berikut di server:

```bash
# 1. Jadikan script deploy executable
chmod +x deploy.sh

# 2. Jalankan deployment
./deploy.sh
```

## Manual Deployment Steps

Jika script deploy tidak berfungsi, ikuti langkah-langkah berikut:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install/update dependencies
npm install

# 3. Clean build cache
rm -rf .next

# 4. Build application
npm run build

# 5. Restart application (jika menggunakan PM2)
pm2 restart visitor-counter
# Atau jika running langsung:
# npm start
```

## Verify Features

Setelah deployment, jalankan script berikut untuk memverifikasi semua fitur:

```bash
node check-features.js
```

## Common Issues & Solutions

### 1. Halaman Login Tidak Berubah

**Problem**: Login page masih menampilkan desain lama

**Solution**:
```bash
# Clear browser cache
- Tekan Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
- Atau buka di incognito/private window

# Restart aplikasi
pm2 restart visitor-counter
```

### 2. Menu "Add Data" Tidak Muncul

**Problem**: Menu Add Data tidak muncul di sidebar

**Solution**:
```bash
# Check apakah file sudah terupdate
ls -la src/app/dashboard/add-data/

# Restart aplikasi
pm2 restart visitor-counter
```

### 3. Error 401 Unauthorized

**Problem**: Tidak bisa login atau API mengembalikan 401

**Solution**:
```bash
# 1. Inisialisasi database
curl http://localhost:3000/api/init-db

# 2. Check environment variables
cat .env.local

# 3. Restart aplikasi
pm2 restart visitor-counter
```

### 4. Error Database Connection

**Problem**: Tidak bisa connect ke database

**Solution**:
```bash
# 1. Check PostgreSQL service
sudo systemctl status postgresql

# 2. Check connection
psql -h localhost -U visitor -d visitor_counter

# 3. Restart aplikasi
pm2 restart visitor-counter
```

## Environment Variables Checklist

Pastikan file `.env.local` memiliki variabel berikut:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=visitor_counter
POSTGRES_USER=visitor
POSTGRES_PASSWORD=your_password_here

JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

NODE_ENV=production
```

## Default Login Credentials

Setelah inisialisasi database, gunakan credentials berikut:

- **Email**: admin@visitor-counter.com
- **Password**: admin123

## Check Logs

Untuk melihat logs aplikasi:

```bash
# PM2 logs
pm2 logs visitor-counter

# Atau jika running tanpa PM2
npm run start
```

## Browser Cache Issues

Jika masih mengalami masalah setelah deployment:

1. **Hard Refresh**: Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
2. **Clear Cache**: H semua cache browser
3. **Incognito Mode**: Coba buka di private window
4. **Different Browser**: Coba dengan browser lain
5. **Network Tab**: Buka Developer Tools > Network > Disable cache

## Need Help?

Jika masih mengalami masalah:

1. Jalankan `node check-features.js` untuk verifikasi
2. Check logs aplikasi
3. Pastikan semua environment variables terisi dengan benar
4. Restart service PostgreSQL jika perlu