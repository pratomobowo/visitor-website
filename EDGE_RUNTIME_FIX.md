# Edge Runtime Error Fix

## Problem
The application was encountering the following error:
```
The edge runtime does not support Node.js 'crypto' module.
```

## Root Cause
Next.js 15 with Turbopack was defaulting some API routes and middleware to the Edge Runtime, which doesn't support Node.js-specific modules like:
- `crypto` (used by `bcryptjs` and `jsonwebtoken`)
- `pg` (PostgreSQL client)
- `fs` (file system access)

## Solution Applied
I've added explicit Node.js runtime configuration to all affected files:

### 1. Next.js Configuration
Updated `next.config.ts` to force Node.js runtime:
```typescript
const nextConfig: NextConfig = {
  experimental: {
    runtime: 'nodejs',
  },
};
```

### 2. API Routes
Added `export const runtime = 'nodejs';` to all API routes:
- `/api/auth/login/route.ts`
- `/api/auth/logout/route.ts`
- `/api/auth/me/route.ts`
- `/api/track/route.ts`
- `/api/stats/route.ts`
- `/api/stats/all/route.ts`
- `/api/websites/route.ts`
- `/api/inject/route.ts`
- `/api/test-connection/route.ts`
- `/api/test-tracking/route.ts`
- `/api/script/[trackingId]/route.ts`

### 3. Middleware
Updated `src/middleware.ts` to use Node.js runtime.

## Verification
After applying these fixes:
1. Restart the development server: `npm run dev`
2. The application should now run without Edge Runtime errors
3. All authentication and database operations should work correctly

## Alternative Solutions
If you prefer to use Edge Runtime for some routes, you could:

1. **Use Web Crypto API**: Replace `jsonwebtoken` with Web Crypto API for Edge Runtime compatible routes
2. **Use Edge-compatible PostgreSQL client**: Switch to a library like `@neondatabase/serverless`
3. **Split routes**: Keep authentication routes in Node.js and move simple routes to Edge Runtime

However, for your local PostgreSQL setup, Node.js runtime is the most appropriate choice.

## Performance Impact
Using Node.js runtime instead of Edge Runtime has minimal impact for your use case since:
- You're running a local PostgreSQL database
- Authentication requires Node.js crypto modules
- The application is not deployed to edge locations

## Future Considerations
If you decide to deploy to a serverless platform that supports Edge Runtime:
- Consider using a managed PostgreSQL service with HTTP API
- Implement Edge-compatible authentication
- Use Web Crypto API for JWT operations