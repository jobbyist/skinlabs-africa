# 05 — Supabase & Database

## Database Architecture

**PostgreSQL** with **Row-Level Security (RLS)**

Full schema documentation: `supabase/SCHEMA.md`

## Current Production Database

**Project**: `gnkpzijxuciiaamakgzm` ("SkinLabs® South Africa")

Verify via:

```bash
# Check .env
grep VITE_SUPABASE_URL .env

# Check config
cat supabase/config.toml | grep project_id
```

## Migration Workflow

### Creating Migrations

```bash
# Generate timestamp-prefixed migration
# supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

### Applying Migrations

Via MCP tool:

```typescript
mcp__Supabase__apply_migration(
  project_id: "gnkpzijxuciiaamakgzm",
  sql: "-- migration content"
)
```

### Verification

**Always verify after applying**:

```bash
# REST API check
curl "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"

# Or via MCP
mcp__Supabase__execute_sql(
  project_id: "gnkpzijxuciiaamakgzm",
  sql: "SELECT * FROM information_schema.tables WHERE table_name = 'my_table'"
)
```

## Row-Level Security (RLS)

### RLS Must Be Enabled

```sql
CREATE TABLE my_table (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text
);

-- CRITICAL: Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

### Policy Patterns

**Owner can read/write own rows**:

```sql
CREATE POLICY "Users can CRUD own rows"
ON my_table
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
```

**Public read, owner write**:

```sql
CREATE POLICY "Anyone can read published"
ON my_table
FOR SELECT
TO public
USING (published = true);

CREATE POLICY "Owner can update own"
ON my_table
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
```

**Admin access**:

```sql
CREATE POLICY "Admin can read all"
ON my_table
FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id
  OR has_role((select auth.uid()), 'admin')
);
```

### Performance: Use Subquery

```sql
-- GOOD (computed once)
USING ((select auth.uid()) = user_id)

-- BAD (computed per row)
USING (auth.uid() = user_id)
```

## Grants vs RLS

**Both required** for client access:

```sql
-- 1. Grant table-level privilege
GRANT SELECT, INSERT, UPDATE ON my_table TO authenticated;

-- 2. Create RLS policy
CREATE POLICY "Policy name"
ON my_table FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);
```

Without GRANT, you get misleading `42501 "new row violates row-level security policy"`.

## SECURITY DEFINER Functions

Functions that bypass RLS:

```sql
CREATE OR REPLACE FUNCTION admin_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypasses RLS (runs as owner)
END;
$$;

-- CRITICAL: Revoke from everyone
REVOKE ALL ON FUNCTION admin_function() FROM PUBLIC, anon, authenticated;

-- Grant only to specific role if needed
GRANT EXECUTE ON FUNCTION admin_function() TO service_role;
```

**Remember**: `CREATE OR REPLACE` does NOT carry forward REVOKEs.

## Service Role

**Use sparingly** (bypasses RLS):

```typescript
// Edge Function
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);
```

**Only for**:

- Admin operations
- Background jobs
- Email sending
- Payment processing
- Cross-user aggregations

## Key Tables

### Authentication

- `auth.users` (Supabase-managed)
- `profiles` (app-owned, 1:1 with users)
- `user_roles` (admin, professional)

### Membership

- `pricing_plans` (plan definitions)
- `pricing_settings` (global config)
- `payment_subscriptions` (active subscriptions)
- `payment_transactions` (payment history)
- `payment_checkout_intents` (pending PayPal orders)

### SKYNN AI

- `skincare_recommendations` (Basic Analysis results)
- `assessment_definitions` (Advanced question versions)
- `assessment_prompt_versions` (AI prompts, service-role only)
- `advanced_assessment_sessions` (Advanced submissions)
- `advanced_assessment_reports` (Advanced results)
- `advanced_assessment_evidence` (allowed citations)
- `skynn_fairness_events` (metrics, no PII)
- `analysis_passes` (purchased passes)

### Content

- `news_articles` (Daily Skinny briefings)
- `ai_generated_product_reviews` (product reviews)
- `ai_generated_comparisons` (Shelf Showdown)
- `ingredients` (ingredient profiles)
- `ingredient_sources` (multi-citation)
- `ingredient_interactions` (conflicts/synergies)

### Marketplace

- `marketplace_brands`
- `marketplace_products`
- `marketplace_product_images`
- `marketplace_cart_items`
- `marketplace_fx_rates`

### Engagement

- `routine_steps` (manual routine tracker)
- `routine_checkins` (daily completions)
- `notifications` (inbox)
- `podcast_plays` / `podcast_likes` / `podcast_shares`
- `review_ratings` (member ratings)

## Edge Functions

**Deno runtime** (not Node.js)

### Deploying Functions

Via MCP tool:

```typescript
mcp__Supabase__deploy_edge_function(
  project_id: "gnkpzijxuciiaamakgzm",
  name: "my-function",
  verify_jwt: false,  // Match config.toml
  files: [
    { path: "index.ts", content: "..." }
  ]
)
```

### Function Patterns

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }

  // Auth
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  // Service role for admin ops
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Logic...
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Common Edge Functions

See `01-architecture.md` for full list.

## Storage

**Buckets**:

- `skynn-advanced-intake` (private, service-role only)
- `openhaus-product-images` (provisioned, unused)
- `web-stories` (public, published stories)

## pg_cron Jobs

**Scheduled tasks** run in database:

```sql
SELECT cron.schedule(
  'job-name',
  '0 4 * * *',  -- Cron expression
  $$
    SELECT my_function();
  $$
);
```

**Current jobs**:

- `briefings-sync-daily` (04:00 UTC)
- `product-review-sync-daily` (07:00 UTC)
- `shelf-showdown-weekly` (Thursdays 15:00 UTC)
- `skynn-advanced-worker` (every minute, conditional)
- `openhaus-fx-sync` (every 6h)
- `openhaus-picks-rotation` (Mondays 00:00 SAST)
- `openhaus-price-sync` (daily)
- `weekly-newsletter-digest` (Mondays 07:00 UTC)
- `trial-lifecycle-emails-daily` (06:05 SAST, NOT scheduled yet)

## Database Maintenance

### Advisors

Run after DDL changes:

```typescript
mcp__Supabase__get_advisors(
  project_id: "gnkpzijxuciiaamakgzm",
  type: "security"  // or "performance"
)
```

Catches:

- Missing FK indexes
- Inefficient RLS (per-row function calls)
- Improperly secured SECURITY DEFINER functions

### Type Generation

After migrations:

```typescript
mcp__Supabase__generate_typescript_types(
  project_id: "gnkpzijxuciiaamakgzm"
)
// Save output to src/integrations/supabase/types.ts
```

## Known Issues

1. **Large seed migration**: `20260907120004_skincare_intelligence_seed.sql` is too large for one call, requires chunking. See `supabase/SEED_MIGRATION_STATUS.md`.

2. **Pexels API key**: Currently invalid/expired, needs reset for product review images.

3. **Vault secrets**: `product_review_cron_secret`, `briefings_cron_secret`, `shelf_showdown_cron_secret` created but NOT set as Edge Function secrets yet.

4. **MARKETPLACE_CRON_SECRET**: Not set, OpenHaus cron jobs 401.

