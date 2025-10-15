# Visitor Counter

A real-time visitor counter application built with Next.js and Supabase for tracking website analytics across multiple domains.

## Features

- 🔄 **Real-time visitor tracking** - Monitor visitors as they browse your websites
- 🌐 **Multi-website support** - Track up to 5-10 websites from a single dashboard
- 📊 **Analytics dashboard** - View page views, unique visitors, session duration, and more
- 🎯 **Data injection** - Generate fake visitor data for testing purposes
- 📱 **Device analytics** - Track visitor devices, browsers, and operating systems
- 🔒 **Secure authentication** - Admin dashboard with role-based access
- ⚡ **Lightweight tracking script** - Minimal impact on website performance

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL with real-time features)
- **Charts**: Recharts
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd visitor-counter
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL setup script in your Supabase SQL editor:
   ```sql
   -- Copy the contents of supabase-setup.sql and run it in your Supabase project
   ```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

You can find these values in your Supabase project settings:
- Go to Project Settings → API
- Copy the Project URL, anon public key, and service_role key

### 4. Set Up Authentication

1. In your Supabase project, go to Authentication → Settings
2. Enable email/password authentication or your preferred provider
3. Create an admin account
4. After creating your account, get your user ID from the Authentication → Users table
5. Update the profiles table to make your user an admin:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Websites

1. Navigate to the dashboard at `/dashboard`
2. Click "Add Website" in the Websites panel
3. Enter the website name and domain
4. Copy the tracking script provided

### Installing the Tracking Script

Add the tracking script to your website(s) in one of two ways:

#### Option 1: Direct Script Tag
```html
<script src="https://your-app.vercel.app/api/script/YOUR_TRACKING_ID"></script>
```

#### Option 2: Dynamic Script
```html
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://your-app.vercel.app/api/script/YOUR_TRACKING_ID';
  script.async = true;
  document.head.appendChild(script);
})();
</script>
```

Replace `YOUR_TRACKING_ID` with the actual tracking ID from your website settings.

### Viewing Analytics

1. Select a website from the list in the dashboard
2. Choose a time period (Today, Yesterday, Last 7 Days, Last 30 Days)
3. View real-time statistics including:
   - Page views and unique visitors
   - Average session duration
   - Bounce rate
   - Top pages
   - Device breakdown
   - Browser and OS statistics

### Data Injection (Testing)

The data injection feature allows you to generate fake visitor data for testing:

1. Select a website from the dashboard
2. Expand the "Data Injection" section
3. Configure the injection parameters:
   - Number of visitors to generate
   - Date range for the fake data
   - Time distribution pattern
4. Click "Inject Fake Data" to generate test data

⚠️ **Note**: All injected data is marked as fake and can be identified in the database.

## API Endpoints

### Track Visitor Data
```
POST /api/track
```

### Get Website Statistics
```
GET /api/stats?websiteId=ID&period=today|yesterday|week|month
```

### Manage Websites
```
GET /api/websites
POST /api/websites
```

### Inject Fake Data
```
POST /api/inject
```

### Generate Tracking Script
```
GET /api/script/[trackingId]
```

## Database Schema

The application uses the following main tables:

- `websites` - Stores website information and tracking IDs
- `visitors` - Stores individual visitor records
- `daily_stats` - Aggregated daily statistics
- `profiles` - User profile information

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to add these in your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Customization

### Styling

The application uses Tailwind CSS. Modify the styles in:
- `tailwind.config.js` - Tailwind configuration
- Component files for specific styling

### Tracking Script

The tracking script can be customized in:
- `src/app/api/script/[trackingId]/route.ts` - Script generation logic
- `public/track.js` - Base script template

### Dashboard Layout

Modify the dashboard components in:
- `src/components/` - Individual components
- `src/app/dashboard/` - Dashboard pages and layout

## Security Considerations

- Row Level Security (RLS) is enabled on all tables
- Admin users have full access, while tracking is open for anonymous inserts
- Always use HTTPS in production
- Keep your service role key secure and never expose it to the client

## Troubleshooting

### Common Issues

1. **Data not appearing in dashboard**
   - Check that the tracking script is correctly installed
   - Verify the tracking ID matches your website
   - Check browser console for errors

2. **Real-time updates not working**
   - Ensure Row Level Security is properly configured
   - Check that Realtime is enabled for the required tables
   - Verify your Supabase connection

3. **Authentication issues**
   - Check that your user has admin role in the profiles table
   - Ensure authentication is properly configured in Supabase

### Debug Mode

To enable debug logging, add this to your tracking script:
```javascript
window.VisitorCounter.debug = true;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.