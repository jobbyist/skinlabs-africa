# SkinLabs® TanStack Start Migration Status

**Last Updated**: January 2025  
**Current Phase**: Phase 1 - Audit Complete  
**Status**: 🟡 Awaiting Approval to Proceed

---

## Executive Summary

The SkinLabs® website audit is **COMPLETE**. The root cause of SEO/indexability issues has been identified and documented.

**Problem**: The site is a pure client-side React SPA. Vercel rewrites all routes to `/index.html`, which returns an empty HTML shell. All content, metadata, and structured data are injected client-side after JavaScript executes. Crawlers cannot see this content.

**Solution**: Migrate to TanStack Start with server-side rendering for public editorial content.

---

## Documents Created

### ✅ Complete

1. **`docs/architecture/skinlabs-migration-audit.md`** (701 lines)
   - Complete current architecture analysis
   - SEO failure root cause analysis
   - Full route inventory (70+ routes)
   - Database schema analysis (Briefings, Reviews, Ingredients, etc.)
   - Risk assessment and mitigation strategies
   - Success criteria and production-readiness gates
   - Timeline estimate: 12-16 weeks

### 📋 Next Required

2. **`docs/architecture/skinlabs-tanstack-start-architecture.md`** (not yet created)
   - Target architecture design
   - TanStack Start + Vite setup
   - Server/client boundary definition
   - Supabase server-side access pattern
   - SEO utility architecture
   - JSON-LD schema architecture
   - File structure and organization

3. **Migration execution plan** (after architecture approval)

---

## Key Findings from Audit

### Root Cause

From `vercel.json` lines 59-63:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

This SPA fallback rewrite causes every URL to return the same empty HTML shell. No article content reaches crawlers.

### Editorial Sections Migration Order

1. **Briefings** (Daily Skinny) - `/briefings/:slug` - Supabase `news_articles` - **FIRST** (reference implementation)
2. Product Reviews - `/reviews/:slug` - Supabase `reviews`
3. Ingredients - `/ingredients/:slug` - Supabase `ingredients`
4. Knowledge Hub - `/knowledge-hub/:slug` - Static/Mixed
5. Shelf Showdown - `/reviews/versus/:slug` - Static
6. Brand Spotlight - `/spotlight/:brandSlug` - Static
7. Podcast - `/podcast/:slug` - Static

**Rule**: Do not migrate next section until previous section passes production-readiness gate.

### Critical Success Criteria

Before Briefings migration is considered complete:
- ✅ Initial HTTP response contains article title, content, and metadata
- ✅ Valid Article + BreadcrumbList JSON-LD in initial HTML
- ✅ Published articles return HTTP 200, missing slugs return HTTP 404
- ✅ Google Schema Markup Validator can fetch and validate pages
- ✅ No visual regressions
- ✅ Authentication and membership gating still work
- ✅ Vercel deployment succeeds
- ✅ Rollback procedure documented and tested

---

**Status**: Audit complete. Awaiting approval to proceed with target architecture design.
