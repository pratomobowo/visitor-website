# PostgreSQL Migration Guide

This guide will help you migrate your Visitor Counter application from Supabase to a local PostgreSQL instance.

## Prerequisites

1. **PostgreSQL Server**: Make sure you have PostgreSQL installed and running on your system
2. **Node.js**: Version 18 or higher
3. **npm or yarn**: Package manager

## Migration Steps

### 1. Install Dependencies

```bash
npm install
```

This will install the new dependencies required for PostgreSQL:
- `pg` - PostgreSQL client for Node.js
- `bcryptjs` - For password hashing
- `jsonwebtoken` - For JWT authentication
- `dotenv` - For environment variable management

### 2. Configure Environment Variables

Your `.env.local` file has been updated with PostgreSQL connection details:

```env
# PostgreSQL Database Configuration
POSTGRES_DB=visitor_counter
POSTGRES_USER=visitor
POSTGRES_PASSWORD=visitor@#1234
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# JWT Configuration for Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Make sure your PostgreSQL server is configured to accept these credentials.

### 3. Create Database and Schema

Run the setup script to create the database and initialize the schema:

```bash
npm run db:setup
```

This script will:
- Create the `visitor_counter` database if it doesn't exist
- Create all necessary tables (websites, visitors, users, daily_stats)
- Set up indexes and triggers
- Create a default admin user with credentials:
  - Email: `admin@visitor-counter.com`
  - Password: `admin123`

### 4. Start the Application

```bash
npm run dev
```

The application will now be running on `http://localhost:3000` with PostgreSQL as the database backend.

## Authentication Changes

The authentication system has been completely replaced:

### Before (Supabase)
- Used Supabase Auth for user management
- JWT tokens were managed by Supabase
- RLS (Row Level Security) policies

### After (Custom Auth)
- Custom JWT-based authentication
- Users stored in `users` table
- Session management via HTTP-only cookies
- Admin role-based access control

### API Endpoints

New authentication endpoints:
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user info

## Database Schema Changes

The schema has been adapted from Supabase to standard PostgreSQL:

### Key Changes
1. **Users Table**: Replaces Supabase's `auth.users`
2. **UUID Generation**: Uses PostgreSQL's `uuid_generate_v4()` instead of Supabase's `gen_random_uuid()`
3. **No RLS**: Row Level Security has been removed (handled at application level)
4. **Triggers**: Same triggers for `updated_at` and `daily_stats`

### Tables
- `websites` - Website configuration
- `visitors` - Visitor tracking data
- `users` - User accounts and authentication
- `daily_stats` - Aggregated daily statistics

## API Routes

All API routes have been refactored to use PostgreSQL directly:

- `/api/track` - Visitor tracking
- `/api/stats/*` - Statistics and analytics
- `/api/websites` - Website management
- `/api/inject` - Test data injection
- `/api/test-*` - Testing endpoints

## Testing the Migration

1. **Database Connection**: Visit `/api/test-connection` to verify database connectivity
2. **Login**: Use the default admin credentials to login
3. **Create Website**: Add a website to track
4. **Test Tracking**: Use the tracking script or inject test data

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection parameters in `.env.local`
- Ensure the user has necessary permissions

### Authentication Issues
- Clear browser cookies
- Check JWT secret is set in environment variables
- Verify admin user was created in database

### Performance
- The PostgreSQL setup should be faster than Supabase for local development
- Check indexes are properly created on large datasets

## Production Considerations

1. **Security**:
   - Change the JWT secret in production
   - Use environment-specific database credentials
   - Enable SSL for database connections

2. **Performance**:
   - Configure connection pooling
   - Set up proper database backups
   - Monitor query performance

3. **Scaling**:
   - Consider read replicas for analytics queries
   - Implement caching for frequently accessed data

## Rollback Plan

If you need to rollback to Supabase:
1. Keep your Supabase project active
2. Restore the original `.env.local` file
3. Revert to the previous commit
4. Run `npm install` to restore Supabase dependencies

## Support

For issues during migration:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL server is accessible with the configured credentials