# 00 — Project Context

## Product Identity

**SkinLabs®** = South African skincare intelligence infrastructure, not a content subscription.

### Core Mission

Build the most comprehensive, evidence-based skincare knowledge platform for South Africa:

- Free acquisition through SEO and AI analysis
- First-party skin-profile creation
- Ingredient and product knowledge accumulation
- Evidence-based recommendations
- Strategic data accumulation
- Selective monetization
- Editorial independence

### Business Model (CURRENT)

**Member-funded and partly ad-supported**:

- Membership tiers: Glow Explorer (free) / Glow Lite / Glow Insider / Glow VIP
- Free trial available (extended through November 1, 2026)
- Ad-supported (AdSense, labeled sponsored placements, story ads)
- OpenHaus-sourced "Sponsored" reviews
- Analysis Passes (once-off purchase for Advanced AI Analysis)
- Affiliate relationships (labeled, disclosed)

**NOT**: "No ads", "No sponsored content", "We buy every product", "Member-funded, not ad-funded"

### Standing Product Principles

**Optimize for**:

- Free acquisition
- AI analysis completion
- First-party skin-profile creation
- SEO discovery
- Ingredient/product knowledge accumulation
- Retention and trust
- Selective monetization
- Proprietary data accumulation
- Strategic value

**Avoid**:

- Feature sprawl
- Sacrificing editorial independence for monetization
- Fabricating social proof, scarcity, product data, reviews, ratings, or performance claims
- Exposing sensitive user data
- Making unfinished features appear operational

**Prefer**:

- Reusable data models over page-level features
- Real data over fabricated metrics
- Evidence-based claims over marketing hyperbole

## Geographic Context

**Primary market**: South Africa

- Johannesburg/Cape Town/Durban focus
- South African brands prioritized (70%)
- Global brands available in SA (30%)
- POPIA privacy considerations
- SAHPRA regulatory awareness
- Climate considerations (Highveld winter, KZN humidity, Western Cape wind)
- UV index awareness (Southern Hemisphere seasons)

## Technology Stack Overview

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router + TanStack Router/Start (SSR)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Vercel
- **Build Runtime**: Bun
- **AI Providers**: Anthropic Claude (Opus 5/Sonnet 5/Haiku 4.5), Google Gemini (via AI Gateway)
