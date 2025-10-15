# Visitor Counter - Project Summary

## Overview

Aplikasi Visitor Counter adalah sistem pelacakan pengunjung website real-time yang dibangun dengan Next.js dan Supabase. Aplikasi ini dirancang khusus untuk Universitas Sanggabuana untuk memantau 5-10 website sekaligus dengan fitur injeksi data untuk testing.

## Fitur Utama

✅ **Real-time Visitor Tracking** - Memantau pengunjung saat mereka menjelajahi website  
✅ **Multi-website Support** - Melacak 5-10 website dari satu dashboard  
✅ **Analytics Dashboard** - Menampilkan page views, unique visitors, session duration  
✅ **Data Injection** - Generate fake visitor data untuk testing  
✅ **Device Analytics** - Track devices, browsers, dan operating systems  
✅ **Secure Authentication** - Admin dashboard dengan role-based access  
✅ **Lightweight Tracking Script** - Minimal impact pada website performance  

## Teknologi yang Digunakan

- **Frontend**: Next.js 14 dengan TypeScript dan Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL dengan real-time features)
- **Charts**: Recharts
- **Deployment**: Vercel (recommended)

## Struktur Proyek

```
visitor-counter/
├── src/
│   ├── app/
│   │   ├── api/                 # API endpoints
│   │   │   ├── track/          # Tracking endpoint
│   │   │   ├── websites/       # Website management
│   │   │   ├── stats/          # Statistics API
│   │   │   ├── inject/         # Data injection
│   │   │   └── script/         # Dynamic script generation
│   │   ├── dashboard/          # Dashboard pages
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── StatsCard.tsx       # Statistics cards
│   │   ├── VisitorChart.tsx    # Visitor charts
│   │   ├── WebsiteList.tsx     # Website management
│   │   └── InjectForm.tsx      # Data injection form
│   └── lib/
│       └── supabase.ts         # Supabase client
├── public/
│   └── track.js                # Base tracking script
├── supabase-setup.sql          # Database setup
├── README.md                   # Main documentation
├── SETUP_GUIDE.md              # Detailed setup guide
└── vercel.json                 # Deployment config
```

## Database Schema

### Tabel Utama:
- **websites** - Informasi website dan tracking IDs
- **visitors** - Record individual visitor
- **daily_stats** - Statistik harian teragregasi
- **profiles** - User profile information

### Fitur Keamanan:
- Row Level Security (RLS) diaktifkan di semua tabel
- Admin users memiliki akses penuh
- Tracking terbuka untuk anonymous inserts
- Auth menggunakan Supabase Auth

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/track` | Track visitor data |
| GET | `/api/stats` | Get website statistics |
| GET | `/api/websites` | List websites |
| POST | `/api/websites` | Add new website |
| POST | `/api/inject` | Inject fake data |
| GET | `/api/script/[trackingId]` | Get tracking script |

## Cara Penggunaan

### 1. Setup Database
```sql
-- Jalankan semua perintah di supabase-setup.sql
```

### 2. Konfigurasi Environment
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Install Tracking Script
```html
<script src="https://your-app.vercel.app/api/script/YOUR_TRACKING_ID"></script>
```

### 4. View Dashboard
- Buka `/dashboard` untuk melihat analytics
- Tambah website melalui interface
- Monitor real-time visitor data

## Fitur Data Injection

Aplikasi menyertakan fitur untuk generate fake visitor data:
- Konfigurasi jumlah visitor
- Pilih rentang tanggal
- Pilih distribusi waktu (even/peak/random)
- Data ditandai sebagai fake untuk filtering

## Deployment

### Vercel (Recommended)
1. Push code ke Git repository
2. Connect ke Vercel
3. Add environment variables
4. Deploy

### Environment Variables Production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Keamanan

- RLS diaktifkan di semua tabel
- Admin role-based access
- HTTPS di production
- Service role key tidak exposed ke client
- CORS configuration untuk cross-domain tracking

## Performance Optimizations

- Menggunakan `sendBeacon()` untuk tracking
- Real-time subscriptions hanya untuk active users
- Script caching untuk tracking script
- Efficient database queries dengan proper indexing
- Batch processing untuk data injection

## Testing

Fitur testing built-in:
- Data injection untuk generate test data
- Debug mode untuk tracking script
- Error handling yang robust
- Comprehensive logging

## Troubleshooting

Common issues dan solusi:
1. **Data tidak muncul** - Check tracking script installation
2. **Auth errors** - Verify admin role di profiles table
3. **Real-time tidak working** - Check RLS policies
4. **Performance issues** - Monitor database queries

## Future Enhancements

Potensi pengembangan:
- Email notifications untuk milestones
- Export data ke CSV/Excel
- Advanced filtering dan segmentation
- Heatmap visualization
- Custom event tracking
- A/B testing integration

## Support

Untuk bantuan:
1. Check `SETUP_GUIDE.md` untuk setup detail
2. Check browser console untuk JavaScript errors
3. Check Supabase logs untuk database errors
4. Verify environment variables

## License

MIT License - bebas untuk digunakan dan dimodifikasi