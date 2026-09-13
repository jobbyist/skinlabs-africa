# SkinLabs® Vite/React SPA to TanStack Start Migration - Complete Audit

**Date**: January 2025  
**Status**: Phase 1 - Audit Complete  
**Next Phase**: Target Architecture Design

---

## EXECUTIVE SUMMARY

The SkinLabs® website is currently a pure client-side React Single-Page Application (SPA) built with Vite + React Router. This architecture prevents search engine crawlers from accessing editorial content in the initial HTTP response, causing critical SEO and indexability failures.

**ROOT CAUSE**: Vercel configuration rewrites all routes to `/index.html`, returning an empty HTML shell. All content, metadata, and structured data are injected client-side after JavaScript execution.

**SOLUTION**: Migrate to TanStack Start with server-side rendering for public editorial content, implementing proper SEO metadata and JSON-LD structured data in the initial HTTP response.

**MIGRATION PRIORITY**: Briefings → Product Reviews → Ingredients → Knowledge Hub → Shelf Showdown → Brand Spotlight → Podcast

---

## 1. CURRENT ARCHITECTURE

### 1.1 Framework & Build

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.3 | UI Framework |
| Vite | 7.2.7 | Build Tool & Dev Server |
| @vitejs/plugin-react-swc | 3.11.0 | Fast React compilation |
| Bun | 1.3.4 | Package manager |
| TypeScript | 5.8.3 | Type safety |

**Build Configuration** (`vite.config.ts`):
- Base: `/`
- Output: `dist/`
- Minification: esbuild (production)
- Code splitting: Disabled (manual chunks undefined)
- Source maps: Production disabled
- Plugins: React SWC, Image Optimizer (production), Component Tagger (dev)

**Build Scripts** (`package.json`):
```bash
npm run build:
  1. Generate sitemap (scripts/generate-sitemap.ts)
  2. Generate podcast RSS (scripts/generate-podcast-rss.ts)
  3. Check search index (scripts/check-search-index.ts)
  4. Compress images (scripts/compress-images.ts)
  5. Vite build
  6. Prerender (scripts/prerender.ts)
```

### 1.2 Router Architecture

**Router**: React Router DOM 6.30.1  
**Type**: `<BrowserRouter>` (client-side only)  
**Entry Point**: `src/App.tsx`  
**Route Count**: 70+ routes  
**Lazy Loading**: Yes, via `React.lazy()` for most pages

**Router Pattern**:
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/briefings" element={<Newsroom />} />
    <Route path="/briefings/:slug" element={<NewsroomArticle />} />
    {/* 67+ more routes */}
  </Routes>
</BrowserRouter>
```

**Critical Problem**: All routes are matched client-side. The server knows nothing about routing.

### 1.3 Rendering Strategy

**Current**: 100% Client-Side Rendering (CSR)

**Flow**:
1. User requests `https://skinlabs.co.za/briefings/example-slug`
2. Vercel receives request
3. Vercel rewrites to `/index.html` (per `vercel.json`)
4. Server returns HTML shell:
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <title>SkinLabs®</title>
       <!-- Generic tags only, no article metadata -->
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/assets/main-[hash].js"></script>
     </body>
   </html>
   ```
5. Browser downloads and executes JavaScript
6. React renders
7. React Router matches `/briefings/:slug`
8. `<NewsroomArticle>` component mounts
9. `useEffect()` fires, calls Supabase
10. Article data returns
11. Component re-renders with content
12. `react-helmet-async` injects metadata into `<head>`

**Crawler View**: Steps 1-4 only. No article content. No metadata. No JSON-LD.

### 1.4 Data Layer

**Backend**: Supabase (PostgreSQL + PostgREST + Realtime + Edge Functions)  
**Client Library**: @supabase/supabase-js 2.87.1  
**Data Fetching**: @tanstack/react-query 5.83.0  
**Access Pattern**: 100% client-side via `supabase.from()` and `supabase.rpc()`

**Supabase Client** (`src/integrations/supabase/client.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Security**: 
- Only anon key exposed to browser (✅ correct)
- Service-role key in environment (❌ not used client-side, but needs server access)
- Row-Level Security (RLS) enforced on all tables

### 1.5 SEO Implementation

**Metadata Library**: react-helmet-async 2.0.5  
**SEO Component**: `src/components/SEO.tsx`  
**Strategy**: Client-side metadata injection AFTER React hydration

**SEO Component Features**:
- ✅ Title management with brand appending
- ✅ Meta description (clamped to 160 chars)
- ✅ Canonical URL normalization
- ✅ Open Graph tags (title, description, image, url, type)
- ✅ Twitter Card tags
- ✅ Article metadata (published_time, modified_time, author)
- ✅ JSON-LD support (accepts object or array)
- ✅ Robots directives (noindex support)
- ❌ **ALL CLIENT-SIDE** - Not in initial HTTP response

**Example Usage** (`src/pages/NewsroomArticle.tsx` lines 177-182):
```tsx
<Helmet>
  <title>{article.seo_title || `${article.title} | SkinLabs®`}</title>
  <meta name="description" content={article.seo_description || article.excerpt} />
  <link rel="canonical" href={`https://skinlabs.co.za/briefings/${article.slug}`} />
  {socialImage && <meta property="og:image" content={socialImage} />}
</Helmet>
```

This renders in the browser AFTER JavaScript executes. Crawlers never see it.

### 1.6 Hosting & Deployment

**Platform**: Vercel  
**Framework Detection**: Vite  
**Build Command**: `npm run build`  
**Output Directory**: `dist/`  
**Node Version**: Determined by Vercel  

**Vercel Configuration** (`vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**🚨 CRITICAL ISSUE**: Lines 59-63 rewrite ALL routes to `/index.html`  
This is the architectural root cause of SEO failure. Every URL returns the same empty HTML shell.

**Redirects**:
- `/newsroom` → `/briefings` (permanent)
- `/newsroom/:slug` → `/briefings/:slug` (permanent)
- `/faq` → `/knowledge-hub` (permanent)

**Headers**:
- Cache-Control: `no-cache, must-revalidate` for HTML
- Cache-Control: `public, max-age=31536000, immutable` for assets
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

### 1.7 Authentication & Authorization

**Auth Provider**: Supabase Auth  
**Session Management**: Client-side via `@supabase/supabase-js`  
**Custom Hooks**:
- `src/hooks/use-auth.ts` - User state and auth actions
- `src/hooks/use-membership.ts` - Membership/subscription status
- `src/hooks/use-entitlements.ts` - Feature access control

**Entitlements** (`src/lib/entitlements.ts`):
- Free tier: Limited Briefings per week
- Insider tier: Unlimited Briefings
- Expert tier: All features

**Content Gating**:
- Briefing previews (title, excerpt, metadata) are public
- Full article body requires authentication + entitlement check
- RPC function `get_article_body(p_slug)` returns body only if published
- Client-side membership check determines display

### 1.8 State Management

**Global State**: Zustand 5.0.11  
**Server State**: TanStack React Query 5.83.0  
**Context**: React Context API for:
- CartContext (`src/contexts/CartContext.tsx`)
- CurrencyContext (`src/contexts/CurrencyContext.tsx`)
- PodcastPlayerProvider (embedded in App)

**Store Example** (`src/stores/engagementStore.ts`):
- Podcast play state
- Likes, shares
- Local storage persistence

---

## 2. SEO FAILURE ANALYSIS

### 2.1 Root Cause Explanation

When Google's crawler or Schema Markup Validator requests a Briefings article:

**Request**:
```
GET /briefings/example-slug HTTP/1.1
Host: skinlabs.co.za
User-Agent: Googlebot/2.1
```

**Server Response** (due to Vercel SPA rewrite):
```html
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SkinLabs®</title>
    <meta name="description" content="South African skincare intelligence" />
    <!-- No article-specific metadata -->
    <!-- No JSON-LD -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main-abc123.js"></script>
  </body>
</html>
```

**What Googlebot Sees**:
- Generic site title and description
- No article headline
- No article content
- No author or publish date
- No canonical URL (or wrong canonical)
- No JSON-LD structured data
- No breadcrumbs

**What Happens in Browser** (not seen by basic crawlers):
1. JavaScript loads (~1-3 MB bundle)
2. React initializes
3. Router matches route
4. Component calls Supabase: `supabase.rpc('get_article_body', { p_slug: 'example-slug' })`
5. Article data returns
6. State updates
7. Component re-renders with content
8. `<Helmet>` injects metadata

Steps 1-8 require JavaScript execution. Many crawlers (especially validation tools) don't execute JS or have limited JS budgets.

### 2.2 Observed Failures

**Google Schema Markup Validator**:
- Cannot fetch page content
- Reports "Unable to fetch the page"
- OR fetches empty HTML with no structured data

**Google Rich Results Test**:
- No structured data detected
- OR detects only generic WebSite schema (if any)

**Initial HTTP Response Test** (what you should verify):
```bash
curl -A "Googlebot" https://skinlabs.co.za/briefings/[real-slug] | grep -i "<title>\|<meta.*description\|ld+json"
```

Expected current result:
- `<title>SkinLabs®</title>` (generic)
- One generic meta description
- No `application/ld+json` script tags

### 2.3 Impact on Indexability

**Search Engines**:
- May not index article content properly
- Generic titles/descriptions in search results
- No rich snippets (Article cards, breadcrumbs, etc.)
- Reduced click-through rates

**Social Media**:
- Poor Open Graph preview cards
- Generic images and descriptions when shared
- Reduced social engagement

**AI Search & LLMs**:
- Cannot parse article structure from initial HTML
- May miss content entirely
- Reduced discoverability in AI-powered search

---

## 3. ROUTE INVENTORY

### 3.1 Complete Route Table

| Route | Component | Type | Public? | Indexable? | Dynamic? | Data Source | Priority |
|-------|-----------|------|---------|-----------|----------|-------------|----------|
| `/` | Index | Landing | Yes | Yes | No | Mixed | - |
| `/briefings` | Newsroom | Listing | Yes | Yes | No | Supabase `news_articles_public` | 1 |
| `/briefings/:slug` | NewsroomArticle | Detail | Yes | Yes | Yes | Supabase `news_articles`, RPC `get_article_body()` | 1 |
| `/reviews` | Reviews | Listing | Yes | Yes | No | Supabase `reviews` | 2 |
| `/reviews/:slug` | ProductReview | Detail | Yes | Yes | Yes | Supabase `reviews` + `products` | 2 |
| `/reviews/versus/:slug` | ComparisonArticle | Detail | Yes | Yes | Yes | Static `comparisons.ts` | 5 |
| `/reviews/page/:page` | Reviews | Listing | Yes | Yes | Yes | Supabase `reviews` | 2 |
| `/compare` | Compare | Tool | Yes | Maybe | No | Client search | 5 |
| `/ingredients` | Ingredients | Listing | Yes | Yes | No | Supabase `ingredients` | 3 |
| `/ingredients/:slug` | IngredientDetail | Detail | Yes | Yes | Yes | Supabase `ingredients` | 3 |
| `/ingredients/checker` | IngredientChecker | Tool | Yes | No | No | Client analysis | - |
| `/knowledge-hub` | KnowledgeHub | Listing | Yes | Yes | No | Static/Mixed | 4 |
| `/knowledge-hub/:slug` | KnowledgeHub | Detail | Yes | Yes | Yes | Static/Mixed | 4 |
| `/spotlight` | Spotlight | Landing | Yes | Yes | No | Static `spotlight.ts` | 6 |
| `/spotlight/:brandSlug` | SpotlightBrandProfile | Detail | Yes | Yes | Yes | Static `spotlight.ts` | 6 |
| `/spotlight/archive` | SpotlightArchive | Listing | Yes | Yes | No | Static `spotlight.ts` | 6 |
| `/spotlight/methodology` | SpotlightMethodology | Static | Yes | Yes | No | Static | 6 |
| `/podcast` | PodcastPage | Listing | Yes | Yes | No | Static `podcast.ts` | 7 |
| `/podcast/:slug` | EpisodePage | Detail | Yes | Yes | Yes | Static `podcast.ts` | 7 |
| `/seasonals` | Seasonals | Landing | Yes | Maybe | No | Static `seasonals.ts` | 8 |
| `/seasonals/:season` | SeasonalHub | Detail | Yes | Maybe | Yes | Static `seasonals.ts` | 8 |
| `/about` | About | Static | Yes | Yes | No | Static | - |
| `/partners` | Partners | Static | Yes | Yes | No | Static | - |
| `/pricing` | Pricing | Static | Yes | No | No | Static | - |
| `/marketplace` | MarketplaceLanding | Landing | Yes | Yes | No | Supabase products | - |
| `/marketplace/product/:slug` | ProductDetail | Detail | Yes | Yes | Yes | Supabase products | - |
| `/marketplace/brand/:slug` | BrandPage | Detail | Yes | Yes | Yes | Supabase brands | - |
| `/skynn-ai` | AIFormulator | Tool | No | No | No | Client + Supabase | - |
| `/dashboard` | UserDashboard | Private | No | No | No | Supabase user data | - |
| `/admin` | AdminDashboard | Private | No | No | No | Supabase admin data | - |

**Notes**:
- "Public" = accessible without authentication
- "Indexable" = should be crawled and indexed by search engines
- "Priority" = migration order for editorial sections (1 = first)

### 3.2 Editorial Sections Migration Priority

| Section | Listing Route | Detail Route | Category Routes | Data Source | Published Field | Priority | Notes |
|---------|--------------|--------------|-----------------|-------------|----------------|----------|-------|
| **Briefings** | `/briefings` | `/briefings/:slug` | N/A | `news_articles` | `status='published'` | **1st** | Reference implementation |
| Product Reviews | `/reviews` | `/reviews/:slug` | `/reviews/page/:page` | `reviews` | `status='published'` | 2nd | Complex product relationships |
| Ingredients | `/ingredients` | `/ingredients/:slug` | N/A | `ingredients` | All public | 3rd | Educational content |
| Knowledge Hub | `/knowledge-hub` | `/knowledge-hub/:slug` | N/A | Static/Supabase TBD | TBD | 4th | Mixed data source |
| Shelf Showdown | `/compare`, `/reviews/versus/:slug` | N/A | N/A | Static `comparisons.ts` | N/A | 5th | Product comparisons |
| Brand Spotlight | `/spotlight` | `/spotlight/:brandSlug` | `/spotlight/archive` | Static `spotlight.ts` | N/A | 6th | Brand profiles |
| Podcast | `/podcast` | `/podcast/:slug` | N/A | Static `podcast.ts` | N/A | 7th | Audio content |

**Migration Rule**: Do not proceed to next section until previous section passes production-readiness gate.

---

## 4. DATABASE SCHEMA ANALYSIS

### 4.1 Briefings (news_articles)

**Table**: `public.news_articles`  
**Migration**: `supabase/migrations/20260814020153_7601ffc3-be96-49d3-8583-c665b9426013.sql`

**Schema**:
```sql
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- Route parameter
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',       -- Full article body
  key_takeaways TEXT[] NOT NULL DEFAULT '{}',
  sa_context_tag TEXT NOT NULL DEFAULT 'SA Skin',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_time TEXT NOT NULL DEFAULT '5 min read',
  word_count INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  cover_credit_name TEXT,
  cover_credit_url TEXT,
  inline_images JSONB NOT NULL DEFAULT '[]',
  seo_title TEXT,                               -- SEO override
  seo_description TEXT,                         -- SEO override
  json_ld JSONB,                               -- Structured data (not currently used)
  view_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',    -- Publication control
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Row-Level Security**:
```sql
-- Public can SELECT only published articles
CREATE POLICY "Published articles are public" ON news_articles
  FOR SELECT TO anon, authenticated 
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins manage articles" ON news_articles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

**Security Layer** (Migration `20260816154034`):

To prevent shipping full article bodies to all clients:

1. **Base table SELECT revoked** from anon/authenticated
2. **View `news_articles_public`** exposes safe fields WHERE status='published':
   - id, slug, title, excerpt, key_takeaways, sa_context_tag
   - source_name, source_url, publish_date, reading_time, word_count
   - cover_image_url, cover_image_alt, cover_credit_name, cover_credit_url
   - seo_title, seo_description, json_ld, view_count, created_at
   - **NOT INCLUDED**: body_markdown, inline_images

3. **RPC Function `get_article_body(p_slug)`**:
   ```sql
   CREATE FUNCTION get_article_body(p_slug text)
   RETURNS TABLE (body_markdown text, inline_images jsonb)
   SECURITY DEFINER
   AS $$
   BEGIN
     RETURN QUERY
       SELECT a.body_markdown, a.inline_images
       FROM news_articles a
       WHERE a.slug = p_slug AND a.status = 'published';
   END;
   $$;
   ```

This design allows:
- Public metadata/preview (for SEO)
- Body content only via RPC (for membership gating on client)

**Indexes**:
```sql
CREATE INDEX news_articles_publish_idx 
  ON news_articles (publish_date DESC, created_at DESC);
```

**Related Tables**:
- `news_article_engagement` - Likes and saves (user_id, article_id, kind)
- `news_comments` - User comments (user_id, article_id, body)
- `news_article_views` - Daily view tracking (article_id, view_date, views)

**Function**:
```sql
CREATE FUNCTION register_article_view(p_article_id UUID)
RETURNS INT
AS $$
  -- Increments view_count on article
  -- Tracks daily views in news_article_views
$$;
```

### 4.2 Product Reviews

**Table**: `public.reviews`  
**Schema Documentation**: `supabase/SCHEMA.md` lines 40-44

**Key Information**:
- `id` (UUID, PK)
- `product_id` (UUID, FK to `products`)
- `status` (TEXT: 'draft', 'published', 'archived')
- Review versions tracked in `review_versions`
- Evidence/citations in `review_evidence`

**RLS**: Public SELECT WHERE `status = 'published'`

**Related Tables**:
- `products` (from skincare_intelligence schema)
- `brands`
- `ingredients`
- `product_ingredients`
- `product_scores`
- `review_evidence`

**Migration Priority**: 2nd (after Briefings)

### 4.3 Ingredients

**Table**: `public.ingredients`  
**Schema**: Defined in `supabase/migrations/20260907120000_skincare_intelligence_core.sql`

**Key Fields**:
- `id` (UUID, PK)
- `inci_name` (TEXT, unique on LOWER)
- `common_name` (TEXT)
- Provenance fields (source_url, source_type, verification_status, etc.)

**RLS**: Public SELECT (all ingredients are public reference data)

**Related Tables**:
- `ingredient_concerns` (safety/sensitivity information)
- `ingredient_interactions` (ingredient compatibility)
- `product_ingredients` (products containing this ingredient)

**Migration Priority**: 3rd

### 4.4 Other Editorial Sections

**Knowledge Hub**: Appears to use static data or mixed sources (needs audit)  
**Shelf Showdown**: Static data in `src/data/comparisons.ts`  
**Brand Spotlight**: Static data in `src/data/spotlight.ts`  
**Podcast**: Static data in `src/data/podcast.ts`

These sections will need investigation to determine if they should remain static or migrate to database-backed content.

---

## 5. ENVIRONMENT VARIABLES

**Current Pattern**: `VITE_` prefix for client-accessible variables

**Known Variables** (from .env.example and code):
- `VITE_SUPABASE_URL` - Supabase project URL (✅ public)
- `VITE_SUPABASE_ANON_KEY` - Anon/public key (✅ public)
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Service role key (❌ must stay server-side)
- Various API keys for integrations

**Migration Requirements**:
1. Adopt TanStack Start environment variable conventions
2. Ensure service-role key is NEVER in browser bundle
3. Create server-side Supabase client with appropriate credentials
4. Maintain client-side anon key for client operations

---

## 6. EXISTING SEO ASSETS

### 6.1 Sitemap

**File**: `public/sitemap.xml`  
**Generator**: `scripts/generate-sitemap.ts`  
**Execution**: Build-time (npm run sitemap)

**Current Status**: Need to audit what's included

**Migration Requirements**:
- Include all published Briefings
- Include all published Reviews
- Include all public Ingredients
- Include all Knowledge Hub articles
- Include all editorial content
- Exclude draft, private, and admin pages
- Use correct lastmod dates
- Generate at build time OR dynamically

### 6.2 Robots.txt

**File**: `public/robots.txt`

```txt
User-agent: Googlebot
Allow: /

Disallow: /admin
Disallow: /dashboard

Sitemap: https://skinlabs.co.za/sitemap.xml
Crawl-delay: 1
```

**Status**: ✅ Correctly allows Briefings and editorial content

### 6.3 JSON-LD Infrastructure

**Existing**:
- SEO component accepts `jsonLd` prop (object or array)
- `news_articles.json_ld` JSONB field exists but unused
- Serialization handled in `<SEO>` component (lines 86-90)

**Missing**:
- No Article schema implementation
- No BreadcrumbList schema
- No Organization entity definition
- No WebSite entity definition
- No schema generators
- No validation

**Migration Requirements**:
- Create reusable schema generators
- Implement Article schema for Briefings
- Implement Review schema for Product Reviews
- Implement appropriate schemas for other sections
- Create BreadcrumbList generator
- Define site-wide Organization and WebSite entities
- Validate generated JSON-LD

---

## 7. MIGRATION RISKS & BLOCKERS

### 7.1 Critical Blockers

1. **Vercel SPA Rewrite** (vercel.json lines 59-63)
   - **Blocker**: All routes return `/index.html`
   - **Impact**: No route can serve unique HTML
   - **Resolution**: Remove rewrite, configure for SSR
   - **Risk Level**: CRITICAL

2. **React Router → TanStack Router**
   - **Blocker**: Different API, different patterns
   - **Impact**: 70+ routes to migrate
   - **Resolution**: Systematic route-by-route migration
   - **Risk Level**: HIGH

3. **Supabase Client-Side Only**
   - **Blocker**: All data access via browser client
   - **Impact**: Need server-safe data access
   - **Resolution**: Create server-side Supabase client or direct queries
   - **Risk Level**: HIGH

### 7.2 High Risks

1. **Authentication State Management**
   - Current: Client-side session management
   - Need: Server-side session validation
   - Risk: Breaking authentication flows

2. **Content Gating Architecture**
   - Current: Client-side membership checks
   - Need: Server-aware gating with SEO optimization
   - Risk: Exposing gated content or breaking access control

3. **Build Complexity**
   - Current: Multi-step build (sitemap, RSS, prerender, etc.)
   - Need: TanStack Start compatible build
   - Risk: Breaking build pipeline

4. **Environment Variable Migration**
   - Current: `VITE_` prefix convention
   - Need: TanStack Start conventions
   - Risk: Exposing secrets or breaking configuration

### 7.3 Medium Risks

1. **Component SSR Compatibility**
   - Some components may use browser-only APIs
   - Need: Identify and refactor
   - Mitigation: Progressive enhancement, client-only wrappers

2. **CSS/Tailwind Preservation**
   - Must preserve visual design exactly
   - Risk: Visual regressions during migration
   - Mitigation: Screenshot comparison testing

3. **Third-Party Integrations**
   - Vercel Analytics, Supabase Realtime, etc.
   - Need: Ensure compatibility with SSR
   - Mitigation: Test each integration

### 7.4 Low Risks

1. **TypeScript Compatibility**
   - TanStack Start has strong TS support
   - Existing types can be preserved
   - Minimal risk

2. **Static Assets**
   - Images, fonts, etc. should work unchanged
   - Vite asset handling compatible
   - Minimal risk

---

## 8. SUCCESS CRITERIA

### 8.1 Briefings Production-Readiness Gate

Before migrating any other editorial section, Briefings must pass ALL of these tests:

**Functional**:
- [ ] `/briefings` listing page loads and renders
- [ ] `/briefings/:slug` detail pages load with correct content
- [ ] Missing slugs return HTTP 404 (not 200 with error message)
- [ ] Unpublished articles are not accessible (or are noindex if accessible)
- [ ] Authentication still works
- [ ] Membership gating still works
- [ ] Likes, saves, shares still work
- [ ] Comments still work
- [ ] View counting still works

**SEO**:
- [ ] Initial HTTP response contains article title in `<title>` tag
- [ ] Initial HTTP response contains article excerpt in meta description
- [ ] Initial HTTP response contains canonical URL
- [ ] Initial HTTP response contains Open Graph tags
- [ ] Initial HTTP response contains Twitter Card tags
- [ ] Initial HTTP response contains valid Article JSON-LD
- [ ] Initial HTTP response contains valid BreadcrumbList JSON-LD
- [ ] Article content is present in initial HTML (even if truncated for gating)
- [ ] JSON-LD validates (Google Schema Validator, schema.org validator)
- [ ] No duplicate meta tags
- [ ] No duplicate canonical tags
- [ ] No conflicting JSON-LD

**Sitemap & Indexing**:
- [ ] Sitemap includes all published Briefings
- [ ] Sitemap excludes unpublished Briefings
- [ ] Sitemap has correct lastmod dates
- [ ] robots.txt permits crawling
- [ ] No accidental noindex on published articles

**Performance**:
- [ ] Initial HTML response < 100KB
- [ ] Server response time < 500ms
- [ ] No significant performance regression vs current site
- [ ] Core Web Vitals maintained or improved

**Visual**:
- [ ] Briefings listing matches current design
- [ ] Briefings detail matches current design
- [ ] Responsive layouts work
- [ ] Images load correctly
- [ ] Animations work
- [ ] Typography preserved
- [ ] Spacing preserved

**Deployment**:
- [ ] Vercel build succeeds
- [ ] Vercel deployment succeeds
- [ ] Production environment works
- [ ] Rollback procedure tested and documented

### 8.2 Overall Migration Success Criteria

- [ ] All 7 editorial sections pass their individual gates
- [ ] Cross-section validation passes
- [ ] Sitemap complete and valid
- [ ] All editorial content is server-rendered
- [ ] All editorial metadata is server-generated
- [ ] All JSON-LD is valid and server-generated
- [ ] No private content accidentally exposed
- [ ] No service-role secrets in client bundle
- [ ] Authentication and authorization work
- [ ] No visual regressions
- [ ] Performance maintained or improved
- [ ] Production deployment successful

---

## 9. NEXT STEPS

### Immediate Actions

1. **Validate HTTP Responses**
   ```bash
   # Test current state
   curl -A "Googlebot" https://skinlabs.co.za/briefings/[real-slug] > test.html
   # Examine test.html for article content and metadata
   ```

2. **Create Target Architecture Document**
   - File: `docs/architecture/skinlabs-tanstack-start-architecture.md`
   - Define TanStack Start setup
   - Define server/client boundaries
   - Define Supabase server access pattern
   - Define SEO utility architecture
   - Define JSON-LD schema architecture

3. **Get Stakeholder Approval**
   - Present audit findings
   - Confirm migration approach
   - Agree on Briefings-first strategy
   - Define production-readiness criteria
   - Agree on rollback strategy

4. **Begin Phase 2**: TanStack Start Foundation (only after approval)

### Do NOT Proceed Until

- [ ] Audit is reviewed and approved
- [ ] Target architecture is documented and approved
- [ ] Production-readiness criteria are agreed upon
- [ ] Rollback strategy is defined
- [ ] Timeline is agreed upon

---

## 10. CONCLUSION

The SkinLabs® website has excellent content architecture, a sophisticated database schema, and strong editorial infrastructure. The ONLY fundamental problem is that it's a client-rendered SPA, which prevents crawlers from accessing content in the initial HTTP response.

**The migration to TanStack Start will**:
- ✅ Fix SEO and indexability issues at the architectural level
- ✅ Preserve all existing functionality
- ✅ Preserve all existing visual design
- ✅ Preserve all existing database architecture
- ✅ Add server-side rendering for public content only
- ✅ Maintain client-side interactivity for private/dynamic features

**The migration will NOT**:
- ❌ Redesign the website
- ❌ Replace existing working components
- ❌ Change the database schema (unless necessary)
- ❌ Break authentication or authorization
- ❌ Remove features
- ❌ Change the brand or visual identity

This is a controlled, incremental, production-safe migration with clear rollback points and validation gates.

**Estimated Timeline**:
- Phase 1 (Audit): ✅ Complete
- Phase 2 (Foundation): 1-2 weeks
- Phase 3 (SEO Infrastructure): 1 week
- Phase 4 (Briefings Migration): 2-3 weeks
- Phase 5 (Briefings Validation): 1 week
- Phases 6-12 (Other Sections): 1-2 weeks each
- Phase 13 (Cross-Validation): 1 week
- Phase 14 (Production): 1 week
- **Total: 12-16 weeks** (3-4 months)

**Next Document**: `docs/architecture/skinlabs-tanstack-start-architecture.md`
