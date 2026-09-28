# 12 — Deployment

## Deployment Architecture

**Stack**: GitHub → GitHub Actions → Vercel

```
GitHub Repository
    ↓
GitHub Actions CI (.github/workflows/ci.yml)
    ↓
Vercel Deployment
    ↓
Production (skinlabs.co.za)
```

## Git Workflow

### Branch Strategy

- **main**: Production branch
- **feature branches**: Work here
- **PR → main**: Deploy via Vercel

### Commit Discipline

**Good commits**:

- Focused on one thing
- Clear commit message
- Reference issue number
- No unrelated changes

**Before committing**:

```bash
git diff  # Review changes
npm run lint
npx tsc -p tsconfig.app.json --noEmit
bun test
npm run build
```

## CI Pipeline

File: `.github/workflows/ci.yml`

**Triggers**:

- Push to any branch
- Pull request

**Jobs**:

1. **checks**:
   - Setup Bun
   - Install dependencies
   - Generate TanStack route tree
   - TypeScript compilation
   - Lint
   - Unit tests

2. **e2e**:
   - Setup Playwright
   - Production build
   - E2E tests (Chromium)

3. **sql-probes**:
   - SQL tests (if `SUPABASE_DB_URL` secret set)

## Vercel Deployment

**Project**: `prj_QiDafIkNxgVHBnDuepg4EvxNsH8J`

### Build Configuration

**Framework**: Vite

**Build Command**: `npm run build`

**Output Directory**: `.vercel/output`

**Install Command**: `bun install`

### Ignored Build Step

**Configured**: Skips build for doc-only changes

```bash
git diff --quiet HEAD^ HEAD -- . ':!docs' ':!content' ':!supabase' ':!*.md' ':!.github'
```

**Skips when**:

- Only docs changed
- Only content manuscripts changed
- Only Supabase migrations changed
- Only markdown files changed
- Only GitHub workflows changed

**Builds when**:

- Source code changed
- Dependencies changed
- Configuration changed

### Environment Variables

**Required** (Vercel Dashboard):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VERCEL_ANALYTICS_ID`
- `ADMIN_PASSWORD` (admin gate)
- `SUPABASE_SERVICE_ROLE_KEY` (serverless functions)

**Optional**:

- `MARKETPLACE_ADMIN_PASSWORD`
- Other feature-specific vars

## Supabase Deployment

### Migrations

**Apply via MCP**:

```typescript
mcp__Supabase__apply_migration(
  project_id: "gnkpzijxuciiaamakgzm",
  sql: "-- migration content"
)
```

**Always verify**:

- Query `information_schema`
- REST API check
- Test affected queries

### Edge Functions

**Deploy via MCP**:

```typescript
mcp__Supabase__deploy_edge_function(
  project_id: "gnkpzijxuciiaamakgzm",
  name: "my-function",
  verify_jwt: false,
  files: [...]
)
```

**Important**:

- Match `verify_jwt` setting from `supabase/config.toml`
- Pin dependencies to specific versions
- Test with real invocation

### Secrets (Edge Functions)

**Set manually** (no MCP tool):

```bash
supabase secrets set KEY=value --project-ref gnkpzijxuciiaamakgzm
```

**Required secrets**:

- `GEMINI_API_KEY_REVIEWS`
- `GEMINI_API_KEY_BRIEFINGS`
- `FIRECRAWL_API_KEY`
- `FIRECRAWL_API_KEY_BRIEFINGS`
- `GOOGLE_API_KEY_COMPARE`
- `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY`
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- `RESEND_API_KEY`
- `OPENWEATHER_API_KEY`
- `PEXELS_API_KEY` (needs reset)
- Cron secrets (Vault, set separately)

## Production-Impacting Operations

**Require explicit authorization**:

- Database migrations (schema changes)
- RLS policy changes
- Edge Function deploys (if changes behavior)
- Environment variable changes
- Payment gateway config changes
- Email template changes

## Deployment Checklist

### Before Merge

- [ ] All tests pass locally
- [ ] CI pipeline green
- [ ] Code reviewed
- [ ] Migrations tested (if any)
- [ ] Environment variables documented
- [ ] Breaking changes identified
- [ ] Rollback plan considered

### After Merge

- [ ] Vercel deployment successful
- [ ] No runtime errors (logs)
- [ ] Critical flows tested on production
- [ ] Migrations applied (if any)
- [ ] Environment variables set (if new)
- [ ] Monitor for errors

## Rollback Procedure

### Code Rollback

**Via Vercel**:

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

**Via Git**:

```bash
git revert <commit-hash>
git push origin main
```

### Database Rollback

**Migrations are forward-only**:

- No automatic rollback
- Write reverse migration if needed
- Test reverse migration first

## Monitoring

### Vercel Logs

**Access**: Vercel Dashboard → Logs

**Retention**: 1 hour (Hobby plan)

**Watch for**:

- 5xx errors
- Function timeouts
- Build failures

### Supabase Logs

**Access**: Supabase Dashboard → Logs

**Watch for**:

- Edge Function errors
- Database errors
- Slow queries

### Analytics

- **Vercel Analytics**: Traffic, pageviews
- **Vercel Speed Insights**: Performance metrics
- **Database**: `analytics_events` table

## Known Deployment Issues

1. **Deployment skew**: Old tabs may break after redeploy (handled by `lazyWithRetry`)
2. **GitHub sync**: Supabase may auto-redeploy from main (can overwrite MCP deploys)
3. **Secrets not set**: Many Edge Functions need manual secret configuration
4. **Large seed migration**: Requires chunking, see `supabase/SEED_MIGRATION_STATUS.md`
5. **MCP bundler**: Can't handle `../` imports, needs local copy workaround

## Emergency Contacts

**Not applicable** (AI agent documentation)

**Instead**: Check CLAUDE.md for operational notes and known issues.

