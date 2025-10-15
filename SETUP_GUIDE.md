# Setup Guide for Visitor Counter

This guide will help you set up the Visitor Counter application with Supabase authentication and security.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Basic knowledge of SQL and web development

## Step 1: Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" to execute the SQL commands

This will create all the necessary tables, functions, triggers, and Row Level Security (RLS) policies.

## Step 2: Environment Configuration

1. Copy the `.env.local.example` file to `.env.local` (or create it)
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project:
- Go to Project Settings → API
- Copy the Project URL, anon public key, and service_role key

## Step 3: Authentication Setup

### Enable Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Under "Site URL", add your application URL (e.g., `http://localhost:3000` for development)
3. Under "Redirect URLs", add the same URL
4. Enable "Email" authentication provider
5. Save your settings

### Create Admin User

1. Go to Authentication → Users
2. Click "Add user" or sign up through your application
3. After creating the user, note their UUID from the Users table
4. Run this SQL command to make them an admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-uuid-here';
```

## Step 4: Testing the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Navigate to the dashboard at `/dashboard`

4. Add your first website:
   - Click "Add Website"
   - Enter a name and domain
   - Copy the tracking script provided

## Step 5: Installing the Tracking Script

Add the tracking script to your website:

```html
<script src="http://localhost:3000/api/script/YOUR_TRACKING_ID"></script>
```

Replace `YOUR_TRACKING_ID` with the actual tracking ID from your website settings.

## Step 6: Verifying Setup

1. Visit your website with the tracking script installed
2. Check the dashboard to see if visitor data appears
3. Try the data injection feature to generate test data

## Troubleshooting

### Common Issues

**"No data appearing in dashboard"**
- Check browser console for errors
- Verify the tracking script is correctly installed
- Ensure the tracking ID matches your website
- Check network tab for failed API calls

**"Authentication errors"**
- Verify your environment variables are correct
- Check that your user has admin role in the profiles table
- Ensure authentication is properly configured in Supabase

**"Real-time updates not working"**
- Check that Row Level Security is enabled
- Verify Realtime is enabled for the required tables
- Check browser console for WebSocket connection errors

### Debug Mode

To enable debug logging for the tracking script:

```javascript
window.VisitorCounter.debug = true;
```

### Checking Database

You can verify data is being stored correctly:

```sql
-- Check recent visitors
SELECT * FROM visitors 
ORDER BY visit_time DESC 
LIMIT 10;

-- Check websites
SELECT * FROM websites;

-- Check daily stats
SELECT * FROM daily_stats 
ORDER BY date DESC;
```

## Security Notes

- Never expose your `SUPABASE_SERVICE_ROLE_KEY` on the client side
- Always use HTTPS in production
- Row Level Security is enabled on all tables
- Admin users have full access, regular users have limited access

## Production Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to add these in your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Post-Deployment Steps

1. Update your Site URL in Supabase Authentication settings
2. Update Redirect URLs to include your production domain
3. Update any hardcoded URLs in your tracking scripts
4. Test the application thoroughly

## API Endpoints Reference

### Core Endpoints

- `POST /api/track` - Track visitor data
- `GET /api/stats` - Get website statistics
- `GET /api/websites` - List websites
- `POST /api/websites` - Add new website
- `POST /api/inject` - Inject fake data
- `GET /api/script/[trackingId]` - Get tracking script

### Authentication

The application uses Supabase Auth for authentication. Admin users can:
- View all websites and statistics
- Add/remove websites
- Inject fake data for testing

Regular tracking does not require authentication - it's open for anonymous visitors.

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the Supabase logs for database errors
3. Verify all environment variables are set correctly
4. Ensure all SQL commands were executed successfully

For additional support, refer to the main README.md file or open an issue in the repository.