# Vercel Requirements Development Plan

## Overview
Phased implementation plan for addressing the 10 required modifications identified in [vercel_prep_plan.md](vercel_prep_plan.md) before Vercel deployment.

---

## Phase 1: Core Configuration (Critical - Must Complete First)

### 1.1 Remove Turbopack from Build Script
**Issue:** Vercel build environment may not support turbopack or it may cause unexpected behavior
**Priority:** HIGH
**Estimated Time:** 2 minutes

**Steps:**
1. Edit [package.json](package.json)
2. Change `"build": "next build --turbopack"` to `"build": "next build"`
3. Keep `"dev": "next dev --turbopack"` unchanged

**Validation:**
```bash
npm run build
npm run start
# Verify app runs correctly on http://localhost:3000
```

**Files Modified:**
- [package.json](package.json)

---

### 1.2 Add Node Version Specification
**Issue:** Vercel may use a different Node version than expected
**Priority:** HIGH
**Estimated Time:** 2 minutes

**Steps:**
1. Edit [package.json](package.json)
2. Add after `"private": true,`:
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
},
```

**Validation:**
```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 10.0.0
```

**Files Modified:**
- [package.json](package.json)

---

### 1.3 Add Prisma Postinstall Script
**Issue:** Custom Prisma output path requires explicit generate step
**Priority:** HIGH
**Estimated Time:** 2 minutes

**Steps:**
1. Edit [package.json](package.json)
2. Add to `"scripts"` section:
```json
"postinstall": "prisma generate"
```

**Validation:**
```bash
rm -rf src/generated/prisma
npm install
# Verify src/generated/prisma/ is created
```

**Files Modified:**
- [package.json](package.json)

---

### 1.4 Create .env.example File
**Issue:** No documentation of required environment variables
**Priority:** HIGH
**Estimated Time:** 5 minutes

**Steps:**
1. Create `.env.example` in project root
2. Add all required variables with empty values:
```env
# Database
DATABASE_URL=

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Chat
ANTHROPIC_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=
```
3. Add descriptive comments for each variable

**Validation:**
- File exists and is tracked in git
- All variables from [.env.vercel](.env.vercel) are documented

**Files Created:**
- `.env.example`

---

## Phase 2: Environment & Error Handling (High Priority)

### 2.1 Add Environment Variable Validation
**Issue:** Missing env vars cause hard-to-debug runtime errors
**Priority:** HIGH
**Estimated Time:** 15 minutes

**Steps:**
1. Create `src/lib/env.ts`
2. Add Zod validation for all required env vars:
```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```
3. Import in API routes that need env vars

**Validation:**
```bash
# Test with missing env var
unset ANTHROPIC_API_KEY
npm run build
# Should fail with clear error message
```

**Files Created:**
- `src/lib/env.ts`

**Files Modified:**
- API routes that use env vars

---

### 2.2 Add Error Boundaries for API Routes
**Issue:** Unhandled errors may expose sensitive info
**Priority:** MEDIUM
**Estimated Time:** 30 minutes

**Steps:**
1. Review all 6 API routes:
   - [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
   - [src/app/api/projects/route.ts](src/app/api/projects/route.ts)
   - [src/app/api/admin/projects/route.ts](src/app/api/admin/projects/route.ts)
   - [src/app/api/admin/projects/[id]/route.ts](src/app/api/admin/projects/[id]/route.ts)
   - [src/app/api/admin/projects/[id]/feature/route.ts](src/app/api/admin/projects/[id]/feature/route.ts)
   - [src/app/api/admin/projects/[id]/publish/route.ts](src/app/api/admin/projects/[id]/publish/route.ts)

2. Ensure each route has:
```typescript
export async function POST(request: Request) {
  try {
    // Route logic
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

3. Add specific error handling for:
   - Database connection errors
   - Validation errors (return 400)
   - Authentication errors (return 401)
   - Not found errors (return 404)

**Validation:**
```bash
# Test each API route with invalid input
curl -X POST http://localhost:3000/api/chat -d '{}'
# Should return proper error response, not stack trace
```

**Files Modified:**
- All 6 API route files

---

### 2.3 Add Application Error Boundaries
**Issue:** Unhandled client-side errors cause poor UX
**Priority:** MEDIUM
**Estimated Time:** 20 minutes

**Steps:**
1. Create `src/app/error.tsx` (root error boundary)
```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

2. Create `src/app/global-error.tsx` (global error boundary)
```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

**Validation:**
- Trigger error in development
- Verify error boundary displays

**Files Created:**
- `src/app/error.tsx`
- `src/app/global-error.tsx`

---

## Phase 3: Build & Configuration Optimization (Medium Priority)

### 3.1 Add Logging Infrastructure
**Issue:** Difficult to debug production issues without structured logging
**Priority:** MEDIUM
**Estimated Time:** 30 minutes

**Steps:**
1. Create `src/lib/logger.ts`:
```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }))
  },
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString()
    }))
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }))
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }))
    }
  },
}
```

2. Replace `console.log` in API routes with structured logger
3. Add request/response logging

**Validation:**
```bash
npm run build && npm start
# Check logs are structured JSON in production mode
```

**Files Created:**
- `src/lib/logger.ts`

**Files Modified:**
- API routes

---

### 3.2 Enhance next.config.ts
**Issue:** Minimal configuration, missing production optimizations
**Priority:** MEDIUM
**Estimated Time:** 15 minutes

**Steps:**
1. Edit [next.config.ts](next.config.ts)
2. Add production optimizations:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable source maps for better error tracking
  productionBrowserSourceMaps: true,

  // Optimize images from Supabase
  images: {
    domains: ['tqulysenjfvocftkdome.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable SWC minification
  swcMinify: true,

  // Strict mode for better error detection
  reactStrictMode: true,

  // Optimize logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

**Validation:**
```bash
npm run build
# Check build output for optimizations
```

**Files Modified:**
- [next.config.ts](next.config.ts)

---

### 3.3 Create vercel.json (Optional but Recommended)
**Issue:** May need custom headers, regions, or build configuration
**Priority:** LOW
**Estimated Time:** 10 minutes

**Steps:**
1. Create `vercel.json` in project root
2. Add configuration:
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    }
  ]
}
```

**Validation:**
- File is valid JSON
- Deploy to Vercel preview to test

**Files Created:**
- `vercel.json` (optional)

---

## Phase 4: Testing & Verification (Critical Before Deploy)

### 4.1 Local Production Build Testing
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**Steps:**
1. Clean build artifacts:
```bash
rm -rf .next
rm -rf node_modules
```

2. Fresh install and build:
```bash
npm install
npm run build
npm run start
```

3. Test all critical paths:
   - Homepage loads
   - `/api/projects` returns data
   - `/admin` redirects to login
   - Project detail pages load
   - Chat functionality works

4. Check for:
   - Build warnings
   - Runtime errors in console
   - Missing environment variables
   - Database connection issues

**Validation Checklist:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] App starts on port 3000
- [ ] All pages load correctly
- [ ] API routes respond
- [ ] Auth flow works
- [ ] No console errors

---

### 4.2 Environment Variable Testing
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**Steps:**
1. Test with missing required env var:
```bash
# Temporarily rename .env.local
mv .env.local .env.local.backup
npm run build
# Should fail with clear error
mv .env.local.backup .env.local
```

2. Test with invalid env var format:
```bash
# Set invalid URL
export NEXT_PUBLIC_SUPABASE_URL="not-a-url"
npm run build
# Should fail validation
```

3. Verify all env vars are used:
```bash
# Search for unused env vars
grep -r "process.env" src/
```

**Validation:**
- Clear error messages for missing vars
- No undefined env var errors at runtime

---

### 4.3 Database Connection Testing
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**Steps:**
1. Test Prisma connection:
```bash
npx prisma db push
npx prisma generate
npx prisma studio
```

2. Test API routes that use database:
```bash
# Get projects
curl http://localhost:3000/api/projects

# Test admin endpoints (with auth)
curl http://localhost:3000/api/admin/projects
```

**Validation:**
- Prisma connects successfully
- Queries execute without errors
- Connection pooling works (check logs)

---

### 4.4 Middleware & Auth Testing
**Priority:** HIGH
**Estimated Time:** 15 minutes

**Steps:**
1. Test unauthenticated access:
   - Visit `/admin` → should redirect to `/admin/login`
   - Visit `/admin/projects` → should redirect to `/admin/login`

2. Test authenticated access:
   - Login at `/admin/login`
   - Access `/admin` → should load
   - Check session persistence

3. Test middleware edge cases:
   - Cookie expiration
   - Invalid session token
   - Concurrent requests

**Validation:**
- Proper redirects work
- Sessions persist across requests
- No infinite redirect loops

---

## Phase 5: Pre-Deployment Preparation

### 5.1 Documentation Updates
**Priority:** MEDIUM
**Estimated Time:** 20 minutes

**Steps:**
1. Update [README.md](README.md):
   - Add environment setup section
   - Document deployment process
   - Add troubleshooting section

2. Add deployment documentation:
```markdown
## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:
- `DATABASE_URL`: Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- ...

## Deployment

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard
5. Deploy to production: `vercel --prod`

## Troubleshooting

### Build Errors
...
```

**Files Modified:**
- [README.md](README.md)

---

### 5.2 Security Review
**Priority:** HIGH
**Estimated Time:** 20 minutes

**Steps:**
1. Verify no secrets in git history:
```bash
git log --all -p | grep -i "api_key\|secret\|password"
```

2. Check `.gitignore` includes:
   - `.env*` (except `.env.example`)
   - `.vercel/`
   - `node_modules/`

3. Review exposed endpoints:
   - Public endpoints: `/api/projects`, `/api/chat`
   - Protected endpoints: `/api/admin/*`

4. Verify middleware protection:
   - All `/admin/*` routes protected
   - No auth bypass possible

**Security Checklist:**
- [ ] No API keys in git history
- [ ] `.env` files in `.gitignore`
- [ ] Admin routes protected by middleware
- [ ] Service role key only used server-side
- [ ] Public keys marked with `NEXT_PUBLIC_`
- [ ] Error messages don't expose internals

---

### 5.3 Final Pre-Deploy Checklist
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**Complete Checklist:**
- [ ] All Phase 1 modifications completed
- [ ] All Phase 2 modifications completed
- [ ] All Phase 3 modifications completed
- [ ] All Phase 4 tests passed
- [ ] `npm run validate` passes (lint + typecheck)
- [ ] Production build succeeds: `npm run build`
- [ ] Local production test passes: `npm start`
- [ ] `.env.example` created and documented
- [ ] No secrets in git history
- [ ] Documentation updated
- [ ] Git working tree clean (all changes committed)

---

## Phase 6: Vercel Deployment

### 6.1 Initial Vercel Setup
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**Steps:**
1. Create Vercel account/login
2. Install Vercel CLI:
```bash
npm i -g vercel
vercel login
```

3. Link project:
```bash
vercel link
```

4. Configure project settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

**Files Created:**
- `.vercel/` directory (gitignored)

---

### 6.2 Environment Variables Configuration
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**Steps:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables

2. Add all variables from `.env.example`:
   - **Production** environment:
     - `DATABASE_URL` (use production Supabase connection string)
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_APP_URL` (set to production URL)

3. Verify variable visibility:
   - `NEXT_PUBLIC_*` → Exposed to browser
   - Others → Server-only

**Validation:**
- All required env vars added
- Production vs preview separation configured
- No sensitive values in public vars

---

### 6.3 Preview Deployment
**Priority:** CRITICAL
**Estimated Time:** 20 minutes

**Steps:**
1. Deploy to preview:
```bash
vercel
```

2. Wait for deployment to complete
3. Open preview URL
4. Run full test suite:
   - [ ] Homepage loads
   - [ ] API routes respond
   - [ ] Database queries work
   - [ ] Auth flow works
   - [ ] Chat functionality works
   - [ ] Images load
   - [ ] No console errors
   - [ ] Check Vercel function logs for errors

5. Monitor Vercel dashboard:
   - Check build logs
   - Check function logs
   - Check for errors

**Validation:**
- Preview deployment succeeds
- All functionality works
- No errors in logs

---

### 6.4 Production Deployment
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**Steps:**
1. Verify preview deployment is working perfectly
2. Deploy to production:
```bash
vercel --prod
```

3. Immediate smoke tests:
   - Homepage loads
   - API responds
   - Database connects
   - Auth works

4. Set up monitoring:
   - Enable deployment notifications
   - Set up error alerts
   - Enable Vercel Analytics (optional)

**Post-Deploy Monitoring (First 24h):**
- [ ] Monitor error rates
- [ ] Check function invocation counts
- [ ] Review performance metrics
- [ ] Verify database connection pool
- [ ] Check Anthropic API usage

---

## Rollback Plan

### If Deployment Fails

**Immediate Actions:**
1. Check Vercel build logs for errors
2. Check function logs for runtime errors
3. Verify environment variables are set correctly
4. Check database connection

**Rollback Steps:**
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify rollback successful

**Debug in Preview:**
1. Create new preview deployment
2. Add debug logging
3. Test specific failing component
4. Fix issue
5. Redeploy

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Build script works without turbopack
- [ ] Node version specified
- [ ] Prisma postinstall works
- [ ] `.env.example` created

### Phase 2 Complete When:
- [ ] Environment validation working
- [ ] All API routes have error handling
- [ ] Error boundaries in place

### Phase 3 Complete When:
- [ ] Structured logging implemented
- [ ] `next.config.ts` optimized
- [ ] Optional: `vercel.json` created

### Phase 4 Complete When:
- [ ] Local production build succeeds
- [ ] All tests pass
- [ ] Middleware works correctly
- [ ] Database connections stable

### Phase 5 Complete When:
- [ ] Documentation complete
- [ ] Security review passed
- [ ] Final checklist complete

### Phase 6 Complete When:
- [ ] Preview deployment successful
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] No errors in first 24h

---

## Time Estimates

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Core Configuration | 15 minutes | CRITICAL |
| Phase 2: Error Handling | 1 hour | HIGH |
| Phase 3: Optimization | 1 hour | MEDIUM |
| Phase 4: Testing | 1 hour | CRITICAL |
| Phase 5: Pre-Deploy Prep | 1 hour | HIGH |
| Phase 6: Deployment | 1 hour | CRITICAL |
| **Total** | **~5 hours** | |

**Minimum Viable Deployment:** Phase 1 + Phase 4 + Phase 6 = ~2 hours
**Recommended Full Implementation:** All phases = ~5 hours

---

## Next Steps

1. **Start with Phase 1** - These are critical blockers for any deployment
2. **Run Phase 4 tests** - Ensure baseline functionality
3. **Proceed to Phase 6** - Deploy to preview
4. **Return to Phases 2-3** - Add error handling and optimizations
5. **Final production deploy** - After all phases complete

**Ready to begin?** Start with Phase 1.1: Remove Turbopack from Build Script
