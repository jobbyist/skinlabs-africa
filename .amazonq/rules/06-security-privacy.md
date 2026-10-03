# 06 — Security & Privacy

## Critical Security Principles

Amazon Q **MUST NEVER**:

- Expose secrets, API keys, or credentials
- Expose service-role credentials
- Commit API keys to the repository
- Bypass RLS (Row-Level Security) policies
- Expose private user data
- Weaken authentication mechanisms
- Circumvent authorization checks
- Log sensitive information unnecessarily
- Fabricate security credentials
- Disable security features "temporarily"

## Secrets Management

### What Counts as a Secret

**NEVER commit**:

- API keys (`GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, etc.)
- Service role keys (`SUPABASE_SERVICE_ROLE_KEY`)
- Payment gateway credentials
- OAuth client secrets
- HMAC signing secrets
- Database passwords
- JWT signing secrets
- Webhook secrets

### Secret Storage Locations

**Supabase Edge Functions**:

- Set via `supabase secrets set KEY=value`
- Access via `Deno.env.get('KEY')`
- OR Vault secrets (pg_cron jobs)

**Vercel Environment Variables**:

- Set in Vercel Dashboard → Project Settings → Environment Variables
- Access via `process.env.KEY` (Node) or `import.meta.env.VITE_KEY` (Vite)

**Local Development**:

- Use `.env.local` (gitignored)
- Document required vars in `.env.example`

### Vault Secrets (Supabase pg_cron)

For cron jobs, use Vault:

```sql
-- Create secret (value never returned)
SELECT vault.create_secret('my_secret', 'actual-secret-value');

-- Use in pg_cron
SELECT cron.schedule(
  'my-job',
  '0 4 * * *',
  $$
    SELECT net.http_post(
      url := 'https://example.com/api',
      headers := jsonb_build_object(
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'my_secret')
      )
    )
  $$
);
```

## Authentication

### Current Auth System (Supabase Auth)

**Methods**:

- Email + password (primary)
- Google OAuth
- Magic link (DISABLED - SMTP issues, keep code)
- MFA/TOTP (optional)

**Auth Flow**:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectUrl,
    data: { marketing_consent: false }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: redirectUrl }
});
```

### Session Management

- Sessions stored in localStorage by Supabase
- Auto-refresh handled by supabase-js
- No server-side session in SSR routes
- SSR routes render public content only

### Admin Access

Admin access = a normal Supabase Auth session (the regular sign-in UI, embedded on `/admin`)
for a user holding the `admin` role (`user_roles` / `has_role()`). `api/admin-analytics.ts`
verifies the bearer token and the role server-side.

## Authorization (RLS)

### Row-Level Security Principles

**Every table with user data MUST have RLS enabled**:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

**Policies must be explicit**:

```sql
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Common RLS Patterns

**Performance**: Use `(select auth.uid())` not `auth.uid()` per row:

```sql
-- GOOD (computed once)
USING ((select auth.uid()) = user_id)

-- BAD (computed per row)
USING (auth.uid() = user_id)
```

**Admin access**:

```sql
CREATE POLICY "Admins can read all"
ON my_table FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = user_id 
  OR has_role((select auth.uid()), 'admin')
);
```

### Service Role Functions

Functions that bypass RLS must be **SECURITY DEFINER** and **service-role only**:

```sql
CREATE OR REPLACE FUNCTION admin_only_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function logic
END;
$$;

-- CRITICAL: Revoke from everyone
REVOKE ALL ON FUNCTION admin_only_function() FROM PUBLIC, anon, authenticated;
```

**Remember**: `CREATE OR REPLACE` does NOT carry forward previous REVOKEs.

## Data Privacy

### Personal Data

**Collect only what's needed**:

- Name, email (required for account)
- Phone, address (optional, profile completeness)
- Skin concerns, allergies (optional, analysis)

**NEVER collect**:

- Government ID numbers
- Financial information (handled by payment gateways)
- Medical diagnosis (not a medical service)
- Photos (SKYNN AI policy: photos never leave device)

### POPIA Considerations (South Africa)

**Protection of Personal Information Act**:

- Collect with consent
- Use for stated purpose only
- Secure storage
- Right to access own data
- Right to deletion
- Data breach notification

**Implementation**:

- Marketing consent checkbox (unchecked by default)
- Unsubscribe mechanism (RFC 8058)
- Data export (PDF via `generateAccountDataPdf.ts`)
- Account deletion (`account-delete` edge function)

### MST (Monk Skin Tone) Policy

**CRITICAL**: Photos never analyzed, MST never inferred

- MST is **self-reported only**
- Source checked: `mst_source = 'user_reported'` (database CHECK constraint)
- Photos used only for self-assessment, never uploaded
- Test: `skynnNoToneInference.test.ts` scans for violations

## Input Validation

### Client-Side

Use Zod schemas:

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.safeParse(input);
if (!result.success) {
  // Handle validation errors
}
```

### Server-Side

**Always validate server-side** (never trust client):

```typescript
// Edge Function validation
const schema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive()
});

const parsed = schema.parse(await req.json());
```

### SQL Injection Prevention

**Use parameterized queries** (Supabase handles this):

```typescript
// GOOD
const { data } = await supabase
  .from('profiles')
  .select()
  .eq('email', userEmail);

// NEVER build SQL strings
```

## CSRF Protection

**Payment webhooks**: Verify signatures

```typescript
// PayFast ITN
const isValid = await verifyPayfastSignature(params);

// PayPal Webhook
const isValid = await verifyPaypalWebhook(headers, body);
```

## Rate Limiting

### API Quotas

Track usage in `pipeline_api_usage`:

- Gemini: 100/day default (configurable)
- Firecrawl: 20/day default (configurable)
- Per-minute limits enforced

### User Actions

Simple daily limits in Edge Functions:

```sql
-- Check daily limit
SELECT COUNT(*) 
FROM actions 
WHERE user_id = $1 
  AND created_at > now() - interval '24 hours';
```

## Security-Sensitive Changes

**Require explicit review**:

- Authentication changes
- Authorization changes
- RLS policy modifications
- SECURITY DEFINER functions
- Payment processing
- API key usage
- Data export/deletion
- Admin access

**Flag in PR description** with `[SECURITY]` prefix.
