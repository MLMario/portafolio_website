# Vercel Deployment Preparation Plan

## Enhanced Checklist

### Core Configuration
- [x] Detect framework and version (e.g., Next.js 13/14 app/router)
- [x] Confirm package.json scripts: build, start, vercel-build if needed
- [ ] Node version set (engines in package.json or .nvmrc)
- [x] Build output directory defined or auto-detected (e.g., .next, dist, out)
- [ ] vercel.json present if custom routes/build/output required
- [ ] Environment variables listed and typed (.env.example or README)
- [x] Root vs monorepo config: project root, workspace settings
- [x] Edge/Node runtimes, middleware, and image optimization compatibility
- [x] Static file locations (public/), redirects/rewrites, headers
- [x] Framework-specific config: next.config.js, vite.config, tsconfig
- [ ] CI/CD expectations: VERCEL_ORG_ID, VERCEL_PROJECT_ID if using CLI
- [x] Ignore files: .gitignore, .vercelignore as needed

### Additional Items
- [ ] **Database connection pooling** - Verify Prisma connection limits for serverless
- [ ] **Supabase auth cookies** - Ensure middleware cookie handling works in production
- [ ] **API route error handling** - Verify all API routes have proper error responses
- [ ] **Build-time vs runtime env vars** - Separate NEXT_PUBLIC_ vars correctly
- [ ] **Turbopack compatibility** - Test build without --turbopack flag for Vercel
- [ ] **Prisma generate in build** - Ensure prisma client generates during build
- [ ] **Anthropic SDK rate limiting** - Add error handling for API limits
- [ ] **Image optimization** - Verify Next.js image optimization works with Supabase URLs
- [ ] **Dynamic routes pre-rendering** - Check if project slugs need generateStaticParams
- [ ] **Sitemap generation** - Verify dynamic sitemap doesn't cause build errors

---

## Current State

### Framework
- **Framework:** Next.js 15.5.4 (App Router)
- **React:** 19.1.0
- **TypeScript:** v5

### Build Scripts
```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "validate": "npm run lint && npm run typecheck"
}
```

### Node/Runtime
- **Current:** No explicit Node version specified
- **Runtime:** Node.js runtime (middleware uses `createServerClient`)
- **Edge compatibility:** Middleware is Edge-compatible

### Environment Variables Needed
Based on [.env.vercel](/.env.vercel):
```
DATABASE_URL                    # Prisma/Supabase PostgreSQL with pgbouncer
NEXT_PUBLIC_SUPABASE_URL        # Public Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public anon key for client
SUPABASE_SERVICE_ROLE_KEY       # Server-side service role key
ANTHROPIC_API_KEY               # For AI chat functionality
NEXT_PUBLIC_APP_URL             # App URL (production will differ)
```

### Routing/Rewrites
- **Middleware:** [src/middleware.ts:53](src/middleware.ts#L53) - Auth protection for `/admin/*` routes
- **API Routes:** 6 API routes in [src/app/api/](src/app/api/)
  - `/api/chat` - Anthropic chat endpoint
  - `/api/projects` - Public projects API
  - `/api/admin/projects` - CRUD operations
- **Dynamic Routes:** `/admin/:path*`, `/projects/[slug]`
- **No custom rewrites/redirects** in next.config.ts (currently minimal)

### Monorepo Layout
- **Type:** Single project (not a monorepo)
- **Root:** Project root is repository root
- **Prisma output:** Custom path `../src/generated/prisma`

### Database
- **Provider:** Supabase PostgreSQL
- **ORM:** Prisma with pgbouncer connection pooling
- **Migrations:** Required before deployment
- **Schema:** 3 models (User, Project, ChatSession)

---

## Required Modifications

### Issue 1: Missing Node version specification
**Why:** Vercel may use a different Node version than expected, causing compatibility issues
**Fix:** Add to [package.json](package.json):
```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

### Issue 2: Turbopack flag in build script
**Why:** Vercel's build environment may not support turbopack or it may cause unexpected behavior
**Fix:** Update [package.json](package.json) build script:
```json
"build": "next build"
```
Keep turbopack only for local dev.

### Issue 3: Missing .env.example file
**Why:** No documentation of required environment variables for deployment
**Fix:** Create `.env.example` with sanitized variable names:
```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Issue 4: Prisma client generation not explicit in build
**Why:** Custom output path may require explicit generate step
**Fix:** Add postinstall script to [package.json](package.json):
```json
"postinstall": "prisma generate"
```

### Issue 5: DATABASE_URL uses pgbouncer for production
**Why:** Current DATABASE_URL has `pgbouncer=true&connection_limit=1` which is correct for serverless
**Fix:** ✅ Already configured correctly - ensure this format is used in Vercel env vars

### Issue 6: Missing vercel.json for optimal configuration
**Why:** May need custom headers, regions, or build configuration
**Fix:** Consider adding `vercel.json` if needed:
```json
{
  "regions": ["iad1"],
  "framework": "nextjs",
  "buildCommand": "npm run build"
}
```

### Issue 7: Runtime environment variable validation
**Why:** Missing env vars cause runtime errors that are hard to debug
**Fix:** Add env validation in `next.config.ts` or create `src/lib/env.ts` with Zod validation

### Issue 8: No error boundary for API routes
**Why:** Unhandled errors in API routes may expose sensitive info
**Fix:** Review all 6 API routes for try-catch blocks and error handling

### Issue 9: Middleware auth may fail on first deploy
**Why:** Supabase session cookies may not persist correctly
**Fix:** Test middleware with Vercel preview deployment, verify cookie settings

### Issue 10: Static optimization for public routes
**Why:** Project listing could be statically generated for better performance
**Fix:** Consider adding `generateStaticParams` for `/projects/[slug]` if projects are relatively static

---

## Error Logging Plan

### Source Maps on Build
- **Status:** ON by default in Next.js
- **How:** Next.js automatically generates source maps in production
- **Verification:** Check `.next/static/` folder after build
- **Configuration:** Can customize in [next.config.ts](next.config.ts):
  ```typescript
  const nextConfig: NextConfig = {
    productionBrowserSourceMaps: true, // Enable client source maps
  }
  ```

### Runtime Logging
- **Primary:** Console logs (accessible via Vercel dashboard)
- **Current implementation:** Standard `console.log`, `console.error`
- **Structured logging:** Consider adding `pino` or `winston` for production
- **API route logging:** Add request/response logging in [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
- **Error tracking:** Consider Sentry or Vercel Speed Insights integration

### Vercel Logs Access
- **Real-time logs:** Vercel Dashboard → Project → Logs tab
- **Function logs:** Filter by function path (e.g., `/api/chat`)
- **Error filtering:** Filter by log level: `error`, `warn`, `info`
- **Log retention:** Varies by Vercel plan (Pro: 7 days, Enterprise: longer)
- **CLI access:** `vercel logs [deployment-url] --follow`

### Alerts
- **Simple Rule:** Email alert on deployment failures + function errors
- **Channel:** Email or Slack integration
- **Configuration:**
  - Vercel Dashboard → Project → Settings → Notifications
  - Enable: "Deployment Failed" + "Function Errors"
  - Advanced: Set up Vercel Monitoring for latency/error rate alerts

### Monitoring Recommendations
1. **Vercel Speed Insights:** Track Core Web Vitals
2. **Vercel Web Analytics:** Track page views without cookies
3. **Custom error handler:** Add `src/app/error.tsx` and `src/app/global-error.tsx`
4. **API monitoring:** Log request duration and error rates for each endpoint

---

## Testing Plan

### Pre-Deployment Testing

#### 1. Local Production Build
```bash
# Test production build locally
npm run build
npm run start

# Test without turbopack
npm run build
```
**Expected:** Build succeeds, app runs on localhost:3000

#### 2. Environment Variables Validation
```bash
# Verify all required env vars are set
npm run build
```
**Expected:** No undefined env var errors in build output

#### 3. Database Connection Test
```bash
# Test Prisma connection
npx prisma db push
npx prisma generate
```
**Expected:** Successful connection to Supabase

#### 4. API Routes Testing
- Test `/api/chat` with valid and invalid requests
- Test `/api/projects` for public access
- Test `/api/admin/*` routes with/without auth
**Expected:** Proper error responses, no 500 errors

#### 5. Middleware Auth Flow
- Test `/admin` redirect when not authenticated
- Test `/admin/login` access
- Test session persistence
**Expected:** Correct redirects, working auth

### Vercel Preview Deployment Testing

#### 1. Initial Preview Deploy
```bash
vercel --prod=false
```
**Tests:**
- ✅ Build completes without errors
- ✅ Environment variables are set correctly
- ✅ Database connections work
- ✅ API routes respond correctly
- ✅ Middleware auth works
- ✅ Static assets load from `/public`

#### 2. Function Testing
- Test each of the 6 API routes in preview
- Monitor function logs in Vercel dashboard
- Check function execution time (cold starts)
**Expected:** <1s response time, no timeouts

#### 3. Edge Middleware Testing
- Test `/admin` route protection
- Verify Supabase auth cookies persist
- Test redirect behavior
**Expected:** Secure routes protected, proper redirects

#### 4. Dynamic Route Testing
- Test `/projects/[slug]` with existing slugs
- Test 404 behavior for non-existent slugs
- Verify markdown rendering
**Expected:** Correct pages load, 404 handling works

### Production Deployment Testing

#### 1. Smoke Tests (Immediate Post-Deploy)
- [ ] Homepage loads
- [ ] `/api/projects` returns data
- [ ] `/admin` redirects to login
- [ ] Project detail pages load
- [ ] Chat functionality works
- [ ] Images load from Supabase

#### 2. Performance Testing
- [ ] Lighthouse score >90 for key pages
- [ ] API response times <500ms
- [ ] Time to First Byte (TTFB) <200ms
- [ ] Core Web Vitals pass

#### 3. Integration Testing
- [ ] Supabase auth flow end-to-end
- [ ] Anthropic chat API responds
- [ ] Database queries execute
- [ ] File uploads work (if applicable)

#### 4. Error Scenario Testing
- [ ] Missing env var handling
- [ ] Database connection failure
- [ ] API rate limit handling
- [ ] Invalid authentication attempts

### Rollback Plan
1. Keep previous deployment URL saved
2. If issues found, instant rollback via Vercel dashboard
3. Debug using preview deployment
4. Redeploy when fix confirmed

### Post-Deploy Monitoring (First 24h)
- Monitor error rates in Vercel dashboard
- Check function invocation counts
- Review performance metrics
- Verify database connection pool usage
- Check Anthropic API usage/costs

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run validate` locally (lint + typecheck)
- [ ] Test production build: `npm run build && npm start`
- [ ] Verify all env vars in `.env.vercel` are documented
- [ ] Database migrations applied to production database
- [ ] Create `.env.example` file
- [ ] Update [package.json](package.json) with Node version and postinstall
- [ ] Remove turbopack from build script
- [ ] Review and sanitize any secrets in git history

### Vercel Setup
- [ ] Create new Vercel project
- [ ] Link to GitHub repository
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Configure domain (if custom domain needed)

### First Deploy
- [ ] Deploy to preview first
- [ ] Run all preview deployment tests
- [ ] Check Vercel function logs for errors
- [ ] Verify database connections work
- [ ] Test all API endpoints
- [ ] Promote to production when preview passes

### Post-Deployment
- [ ] Set up deployment notifications
- [ ] Configure error alerts
- [ ] Enable Vercel Analytics/Speed Insights
- [ ] Update `NEXT_PUBLIC_APP_URL` if using custom domain
- [ ] Document deployment process in README
- [ ] Add deployment status badge (optional)

---

## Additional Notes

### Turbopack Status
- Currently enabled for both dev and build
- Vercel supports Turbopack, but recommend testing without it first
- May cause inconsistencies between local and Vercel builds

### Database Considerations
- Using pgbouncer connection pooling (good for serverless)
- Connection limit set to 1 (appropriate for Vercel functions)
- Ensure Supabase project is in same region as Vercel functions (low latency)

### Security
- Supabase keys are scoped correctly (anon vs service_role)
- Admin routes protected by middleware
- Consider adding rate limiting for `/api/chat` endpoint
- Review CORS settings if adding external clients

### Cost Optimization
- Monitor Anthropic API usage (chat endpoint)
- Consider caching chat responses for common queries
- Use Vercel Edge Functions for middleware (included in free tier)
- Optimize images served from Supabase

### Future Enhancements
- Add Sentry for error tracking
- Implement incremental static regeneration for projects
- Add API route authentication for admin endpoints
- Set up automated testing in CI/CD
- Add performance budgets
