# 01 — Architecture

## Current Production Architecture

### Frontend Framework (CURRENT)

**React 19** + **TypeScript** (strict: false, strictNullChecks: true)

- **SPA Build**: Vite 7 with React Router 6
- **SSR Routes**: TanStack Router/Start with Nitro (Vercel preset)
- **UI Components**: Radix UI + shadcn/ui patterns
- **Styling**: Tailwind CSS 3 with custom design system
- **State Management**: React Query (TanStack Query 5), Zustand (selective)
- **Forms**: React Hook Form + Zod validation

### Routing Architecture (CURRENT)

**Hybrid SPA + SSR**:

#### SPA Routes (React Router 6)

Most application routes render client-side:

- `/` (Home)
- `/skynn-ai` (SKYNN AI Basic Analysis)
- `/skynn-ai/advanced` (Advanced Assessment - feature flagged)
- `/dashboard` (User Dashboard)
- `/pricing` (Membership Plans)
- `/marketplace/*` (OpenHaus)
- `/podcast`, `/podcast/:slug` (Episodes)
- All other public pages

#### SSR Routes (TanStack Start)

SEO-critical content renders server-side:

- `/briefings/:slug` (Daily Skinny articles)
- `/reviews/:slug` (Product reviews)
- `/ingredients/:slug` (Ingredient profiles)
- `/spotlight/:slug` (Spotlight brand profiles)
- `/sitemap.xml` (Live-generated sitemap)
- `/web-stories/:slug` (AMP stories)

**SSR routes**:

- Generate `<head>` metadata server-side
- Render JSON-LD structured data
- Serve crawlers the full content immediately
- Still hydrate to SPA after initial load

Located in: `src/routes/*.tsx` (distinguished from `src/pages/*.tsx`)

### Server/Client Boundaries

- **No server-side session** in this app's SSR routes
- SSR routes render **signed-out content only**
- Personalization happens after hydration
- Use `createSupabaseServerClient()` for SSR data fetching
- Use `createSupabaseBrowserClient()` for SPA data fetching

### Data Fetching (CURRENT)

- **Client-side**: React Query (`@tanstack/react-query`)
- **Server-side**: TanStack Router loaders (`createServerFn`)
- **Real-time**: Supabase Realtime subscriptions (selective)
- **Caching**: React Query with 5min staleTime default

### API Architecture (CURRENT)

**Supabase Edge Functions** (Deno runtime):

Primary API layer:

- `account-delete`: Account deletion
- `auth-token-exchange`: Cross-domain auth
- `briefings-sync`: Daily Skinny pipeline (pg_cron)
- `email-processor`: Email automation (pg_cron)
- `email-unsubscribe`: RFC 8058 unsubscribe
- `email-webhooks`: Resend delivery events
- `newsroom-sync`: Legacy briefings (manual trigger only)
- `openhaus-*`: Marketplace sync functions
- `payfast-payment`: PayFast checkout + ITN
- `paypal-payment`: PayPal checkout + webhooks
- `preorder-count`: Legacy endpoint
- `product-review-sync`: Product review pipeline (pg_cron)
- `quote-ss-beauty-submit`: Temporary client form
- `seed-review-images`: Image backfill
- `send-email`: Email delivery (service-role only)
- `shelf-showdown-sync`: Comparison pipeline (pg_cron)
- `skin-weather`: Weather cache
- `skincare-ai`: Legacy SKYNN AI v1 (stub)
- `skynn-advanced-assessment`: Advanced Analysis API
- `skynn-advanced-worker`: Advanced Analysis processor (pg_cron)

**Vercel Serverless Functions** (`api/*.ts`):

Secondary endpoints:

- `api/admin-analytics.ts`: Admin dashboard data
- `api/admin-auth.ts`: Admin credential gate
- `api/marketplace-auth.ts`: OpenHaus gate

### Supabase Architecture (CURRENT)

**Database**: PostgreSQL with Row-Level Security (RLS)

Key tables documented in `supabase/SCHEMA.md`:

- **Auth**: Standard Supabase Auth (`auth.users`)
- **Profiles**: `profiles` (user data, RLS protected)
- **Membership**: `pricing_plans`, `payment_subscriptions`, `payment_transactions`
- **Content**: `news_articles`, `ai_generated_product_reviews`, `ingredients`
- **Marketplace**: `marketplace_*` (OpenHaus)
- **SKYNN AI**: `skincare_recommendations`, `advanced_assessment_sessions`
- **Engagement**: `routine_steps`, `routine_checkins`, `notifications`

**Authentication** (Supabase Auth):

- Email + password (primary)
- Google OAuth
- Magic link (disabled, SMTP issues)
- MFA (optional, TOTP)

**Authorization** (RLS + Ladder):

Membership tiers via `src/lib/entitlements.ts`:

- **Glow Explorer** (free, default)
- **Glow Lite** (R39/month)
- **Glow Insider** (R79/month)
- **Glow VIP** (R199/month, not purchasable yet - "Coming soon")
- **Founding Member** (R499 lifetime, limited slots)
- **Professional** (dermatologist verification)

## Content Architecture (CURRENT)

### Static Content

- FAQ: `src/data/faq.ts`
- Podcast episodes: `src/data/podcast.ts`
- Seasonals: `src/data/seasonals.ts`
- Legacy reviews: `src/data/reviews.ts` (being migrated to DB)
- Comparisons: `src/data/comparisons*.ts`

### Database-Driven Content

- Daily Skinny briefings: `news_articles`
- Product reviews: `ai_generated_product_reviews`
- Ingredient profiles: `ingredients`
- Marketplace products: `marketplace_products`

### Content Pipelines (Automated)

**Briefings** (04:00 UTC daily, pg_cron):

- Firecrawl research (9 SA skincare news channels)
- Gemini generation (2-3 articles/day, 1000-1500 words)
- Quality gates (word count, compliance scan)
- Auto-publish to `news_articles`

**Product Reviews** (07:00 UTC daily, pg_cron):

- OpenHaus products (verified catalog)
- Firecrawl research (FTN, SA brands)
- Gemini generation (3 reviews/day)
- Quality gates (score, verdict length, compliance)
- Auto-publish to `ai_generated_product_reviews`
- Ingredient breakdown resolution

**Shelf Showdown** (Thursdays 15:00 UTC, pg_cron):

- Pair selection (same category, never compared)
- Gemini comparison (better-for-X, never universal winner)
- Auto-publish to `ai_generated_comparisons`

**Ingredients** (Weekly Tuesday 04:00 UTC, permanent):

- Research queue from product mentions
- PubMed + DermNet NZ (Firecrawl)
- Evidence-based content
- Verification queue (admin)

## AI Architecture (CURRENT)

### SKYNN AI v2.1 — beta

**Basic AI Skin Analysis** (deterministic):

- Free for all (7-day rolling for Explorer/Lite, unlimited for Insider/VIP)
- No photos, MST self-reported only
- Generates: skin type, concerns, AM/PM routine, PDF
- Grounded product recommendations (real reviews)

**Advanced AI Dermatology Analysis**:

- Requires Analysis Pass (or membership when enabled)
- 73-question assessment (2026.2 definition)
- Anthropic Claude pipeline (Intake → Safety → Reasoning → Writing → QA)
- Dermatologist-approved prompts (SKYNN v2.0.0)
- Manual review gate (admin approval required)
- Fallback mode (CURRENT): Intake PDF via email, 3-4 week turnaround
- Production mode (PLANNED): Async AI generation → admin review → release

## External Services (CURRENT)

- **Supabase**: Database, Auth, Edge Functions, Storage
- **Vercel**: Hosting, Serverless Functions, Edge Network
- **Resend**: Email delivery
- **PayFast**: ZAR recurring payments (South Africa)
- **PayPal**: USD recurring payments (international)
- **Anthropic**: Claude AI (via AI Gateway)
- **Google AI Studio**: Gemini (content pipelines)
- **Firecrawl**: Web scraping/research
- **OpenWeather**: Weather data (One Call 4.0)
- **Pexels**: Stock photos (product reviews, needs key reset)
- **Unsplash**: Editorial photos (via API)
- **Vercel Analytics**: Traffic tracking
- **Vercel Speed Insights**: Performance monitoring
