# TanStack Start Migration — Remaining Content Types: Scope & Priority

**Status: planning document, not yet executed.** Written at the end of
Phase 5 (Reviews) to prepare the next five content-type migrations —
Brand Spotlight, Knowledge Hub, Podcast, Ingredients, Seasonal Guides —
before they're attempted, per the same discipline used for every phase so
far: understand the real data model and the real SEO payoff before writing
route code, rather than mechanically repeating the Briefings/Reviews
pattern against five different content shapes that don't actually share
one shape.

This document is deliberately **not** an implementation — no route code,
no live Vercel deployment, no `SSR_ROUTE_PATTERNS` changes. It exists so
the next phase (or a different coding agent picking this up, per
`CLAUDE.md`) can start from an accurate data-model audit instead of
re-deriving one.

## Data model audit (the actual finding of this document)

The five remaining content types do **not** share one shape. Briefings
(Supabase-table-backed, single source) and Reviews (static + Supabase,
dual source) covered two of the three shapes that actually exist here; a
third shape — pure static, zero live data — covers three of the five
remaining types. Treating all five as "the next Briefings" would be
wrong and would waste a live-deployment cycle on migrations with no real
freshness payoff.

| Content type | Data source(s) | Supabase table(s) | Individual detail pages | SSR freshness payoff |
|---|---|---|---|---|
| **Ingredients** | Supabase only | `ingredients` (128 rows, verification workflow) | `/ingredients/:slug` | **High** — same shape as Briefings; ingredient rows go through an active admin verification queue (`data_quality_status`), so a newly-verified or corrected ingredient is exactly the kind of same-day-freshness case SSR exists for |
| **Brand Spotlight** | Static narrative + Supabase metadata | `spotlight_editions` (edition label, methodology version — no per-brand content) | `/spotlight/:slug` (brand profile) | **Medium** — `brandEditorial` (`src/data/spotlight.ts`) is deliberately human-curated and build-time-static (see `CLAUDE.md`: "stays human-curated" by design); only the edition label/methodology version is live. SSR would mostly move a same-build-time value earlier, not add real freshness |
| **Knowledge Hub** | Pure static | none | `/knowledge-hub/:slug` (deep-linked FAQ answers) | **Low freshness, but a real structured-data opportunity** — no live data to be stale, but no `FAQPage` JSON-LD exists yet anywhere on the site. Migrating this is really "add FAQPage schema," not "add freshness" |
| **Podcast** | Static content + Supabase engagement counters | `podcast_plays`/`podcast_likes`/`podcast_shares` (counts only, not content) | `/podcast/:slug` | **Low** — episode content (title/showNotes/transcript/timestamps) only changes via a deploy anyway (a new episode ships with code); the only live data is play/like/share counts, which are not SEO-relevant and shouldn't be in JSON-LD as if they were verified metrics |
| **Seasonal Guides** | Pure static | none | 4 fixed pages (`/seasonals/spring` etc.) — no per-slug detail route | **Effectively none** — 4 pages total, content changes only via deploy, already fully and cheaply prerendered today |

## Recommended priority order

Based on the audit above, not on the order the five were listed in:

1. **Ingredients** — the only remaining content type with a real,
   recurring freshness case (the admin verification queue actively
   changes `verification_status`/`data_quality_status` on existing rows,
   not just adds new ones). Same shape as Briefings; lowest-novelty
   migration of the five, highest payoff.
2. **Knowledge Hub** — not a freshness play, but a real, currently-missing
   SEO opportunity (`FAQPage` JSON-LD, a schema.org type with genuine
   rich-results eligibility that neither Briefings nor Reviews needed).
   Worth doing specifically for the shared SEO layer's sake — extends
   `src/lib/seo/jsonLd.ts` with `faqPageJsonLd()`, following the same
   pattern as `productReviewJsonLd()`.
3. **Brand Spotlight** — real but narrow payoff (the edition label/
   methodology version badge). Reasonable to combine with a Product/
   Review-style JSON-LD extension for brand profile pages
   (`Organization`/`Brand` schema), which — like Knowledge Hub — is a
   structured-data addition independent of the freshness question.
4. **Podcast** — low priority. If migrated at all, scope it to the
   `PodcastEpisode` JSON-LD type (a real schema.org type with fields
   already available — `duration`, `datePublished` — from
   `src/data/podcast.ts`), not to chasing engagement-counter freshness,
   which doesn't belong in structured data anyway.
5. **Seasonal Guides** — do not migrate. Four static pages with no
   freshness case and no missing structured-data opportunity
   (`STATIC_ROUTES` + `scripts/prerender.ts` already cover this
   correctly and cheaply). Revisit only if the product adds a fifth
   season-adjacent dynamic page (e.g. a real seasonal product roundup)
   that would change this analysis.

## What actually changes per migration, concretely

Given the shared architecture already built (Phases 4-5), each migration
that does go ahead is a known, bounded unit of work, not a fresh design:

1. Extend `src/lib/seo/jsonLd.ts` / `types.ts` with the one new JSON-LD
   builder the content type needs (`faqPageJsonLd()`,
   `organizationJsonLd()` for Spotlight, `podcastEpisodeJsonLd()`) —
   grounded only in real fields, same discipline as
   `productReviewJsonLd()`'s optional-`offers` fix.
2. Add `src/routes/<content-type>.$slug.tsx` — a server loader
   (`createServerFn`) resolving the real data source(s) from the table
   above, a `head()` composing `buildHeadTags()`, and a component reusing
   the existing page's interactive parts (the `MemoryRouter` wrapper
   pattern from Reviews, if the reused components need router context).
3. Add exactly one new entry to `SSR_ROUTE_PATTERNS` in
   `scripts/assemble-vercel-output.ts` — the single-segment regex
   pattern, positioned before the filesystem phase, after the existing
   entries. **Do not** touch the fallback route added in Phase 5 (`{src:
   "/(.*)", dest: "/__server"}`) — it's content-type-agnostic and already
   correct for any new SSR pattern.
4. Live-validate on a real Vercel deployment: the SSR route itself, a
   regression check on every previously-migrated route (Briefings,
   Reviews, the SPA fallback), and a 404 case — mirroring Phase 5's
   validation table exactly. **This step cannot be skipped or shortened**
   — Phase 5 found a site-wide regression that local build success alone
   would never have surfaced, and there is no reason to assume the next
   migration is exempt from a similarly undiscoverable class of bug.
5. Reduce `scripts/prerender.ts`'s crawl for that content type's
   `:slug` pattern **only after** step 4 proves equivalent live coverage
   — never preemptively, per the standing discipline from Phases 4-5.

## Why this phase (Phase 5) did not also implement these

Live-validating one content-type migration (Reviews) this phase surfaced
and resolved a genuine, site-wide, previously-undiscovered routing
regression (see the SPA-fallback section of
`tanstack-start-production-migration.md`) — three failed fix attempts,
each requiring a full real-Vercel-deployment cycle (build ~13-20 minutes
end to end due to `scripts/prerender.ts`'s 326-route headless-Chromium
crawl, plus a live SSO-toggle validation window) before the working fix
was found. Attempting five more content-type migrations in the same
session, each requiring its own live-validation cycle under that same
discipline, was judged too large a scope to execute responsibly in one
pass without risking exactly the kind of rushed, unvalidated change this
project's standing instructions explicitly warn against ("never make an
unfinished feature appear operational"). This document is the concrete
hand-off artifact instead: the real data-model audit, a defensible
priority order, and the exact bounded steps each future migration needs —
so the next session (scheduled or otherwise) starts from analysis, not
from zero.
