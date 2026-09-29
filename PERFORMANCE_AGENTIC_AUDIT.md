# SkinLabs® — Performance + Agentic Web Audit

**Date:** 2026-09-22
**Scope:** Read-only audit. No code was changed to produce this document.
**Stack under audit:** React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui (Radix) + react-router-dom SPA, with a partial TanStack Start SSR layer for four route families (`/reviews/:slug`, `/ingredients/:slug`, `/briefings/:slug`, `/spotlight/:slug`) and a build-time static-HTML prerender step for the rest of the route list, deployed to Vercel.

**Methodology:** Static code analysis (file/line citations throughout) plus one real production build (`npx vite build`) to get actual Rollup chunk sizes rather than estimates — see §2. No live Lighthouse run was performed in this environment (no browser-based CI here); every performance claim below is evidence-based from source and real build output, not simulated.

**Standing constraints honored:** no redesign, no framework migration, no design-system changes, no route/functionality removal, no speculative optimization. Every recommendation below is a targeted, reversible change to loading strategy, asset handling, or markup — not an architectural rewrite.

---

## Implementation status (2026-09-22, same-day follow-up)

Items 1, 2, 3, 5, 6, 7, 9, 10 of the Top 10 (§16) were implemented as written, plus the P8 CLS fix and the extra low-risk cleanups (dead `vendor-date` manualChunk, vestigial `meta http-equiv Cache-Control` tags). **Item 4 (SSR the marketplace product/brand catalog) was withdrawn mid-implementation**: every `/marketplace/*` route turned out to be wrapped in `MarketplaceGate` (`src/components/marketplace/MarketplaceGate.tsx`), which requires a real login cookie (`MARKETPLACE_USERNAME`/`PASSWORD` via `/api/marketplace-auth`) before rendering anything beyond a "Checking marketplace access…" screen or a locked-access page — a fact this audit's original SEO research pass missed. SSR/prerendering it would only ever capture that locked screen, and doing so would run against the explicit "don't expose gated/private content" principle. Instead, `/marketplace/*` was **removed** from both sitemap generators (`src/routes/sitemap[.]xml.ts`, `scripts/generate-sitemap.ts`, `src/lib/sitemap/staticRoutes.ts`) and added to `public/robots.txt`'s `Disallow` list — the correct fix for a gated section is to stop advertising it to crawlers, not to make it crawlable.

A real `npx vite build` after the fixes confirms the projected §2 bundle win landed: the shared JS floor paid by **every** route dropped from **478.80 KB main + 115.97 KB vendor-charts + 126.75 KB vendor-pdf = 721.52 KB gzip** to a single **~420 KB gzip main chunk with zero vendor-chart/PDF preloads** — a ~42% cut, achieved by lazy-loading the homepage's `AIFormulator` widget (item 2) and, discovered during verification, by removing the `vendor-charts`/`vendor-pdf` `manualChunks` entries entirely once they were shown to make Vite unconditionally `modulepreload` those chunks from `index.html` regardless of route (not something the original audit anticipated — documented in `vite.config.ts`'s own comment). `recharts`/`jspdf` still share one on-demand chunk across their several lazy consumers via Rollup's automatic chunking; they just aren't preloaded from the entry HTML anymore.

Also converted the ~18 MB of brand-banner and podcast-cover PNGs to WebP (→ ~1.24 MB, no visible quality loss) as part of item 8's image-compression work, and in the process found and fixed a live, unrelated bug: `src/lib/brand-banners.ts` referenced `.jpg` paths that never existed on disk (the real files were uppercase `.PNG`) — a case-sensitive-filesystem 404 in production on every brand banner image, including ones fed into JSON-LD/OG tags via `getAbsoluteBrandBanner()`.

See `AGENTIC_WEB_AUDIT.md` for the follow-up agentic/AI-crawlability audit performed after these fixes landed.

---

## Executive summary

The single biggest lever in this codebase is **not** image compression or font trimming — it's that two things happen on **every route, on every fresh session**, regardless of which page a visitor or an agent lands on:

1. A full-screen splash/gate overlay (`Preloader.tsx`) blocks the viewport for up to **1.8 seconds** before any real content is interactive-looking, on every route, including deep content pages reached directly from search or an agent.
2. The homepage (`Index.tsx`, the one route that is *not* `React.lazy()`-split) eagerly renders the entire SKYNN AI formulator widget mid-page, which drags `recharts` + `jspdf` + `framer-motion` into the main JS bundle. A real production build confirms this forces **~721 KB gzip / ~2.47 MB raw of JavaScript to be downloaded and `modulepreload`ed on every single route** — including static legal pages like `/privacy-policy` — via `dist/index.html`'s preload tags.

These two findings alone likely explain the majority of any poor mobile Lighthouse score more than any image or font issue. They are addressed first in the Top 10 (§16).

On the agentic/accessibility side, the codebase is in noticeably better shape than typical: zero `<div onClick>`/`<span onClick>` anti-patterns were found anywhere in `src/`, alt text is present and descriptive on effectively all images, and the search UI is genuinely built on Radix `cmdk` primitives. The real gaps are narrower: a handful of unlabeled icon buttons, one invalid interactive-nesting bug on the marketplace wishlist button, ambiguous repeated link text on review/briefing cards, and — most consequential for objective B — an open-ended marketplace product/brand catalog that's listed in the sitemap but is neither SSR'd nor prerendered, meaning it's invisible to any crawler or agent that doesn't execute JavaScript.

---

## 1. Lighthouse / performance issue inventory

Consolidated list of every performance-affecting issue found, each detailed with full evidence in §2–§10. Severity is the audit's own judgment of Lighthouse-score impact (mobile), not a measured score.

| ID | Issue | Severity | Section |
|---|---|---|---|
| P1 | Full-screen splash/gate blocks every fresh-session pageload for up to 1.8s, on every route, not bot-excluded | **Critical** | §6, §7, §9 |
| P2 | Homepage eagerly bundles recharts + jspdf + framer-motion → ~721 KB gzip JS floor on every route | **Critical** | §2, §3 |
| P3 | Hero background is an un-preloadable, randomly-selected, poster-less autoplay UHD video | **High** | §7 |
| P4 | Google Fonts render-blocking stylesheet ships an entirely unused family (Lora) + an underused one (Space Mono) | **Medium** | §4 |
| P5 | ~18 brand-banner + 8 podcast-cover images stored as PNG despite being photographic; no WebP/AVIF conversion in the build pipeline | **Medium** | §4 |
| P6 | `vendor-date` manualChunk is dead (0 bytes) — config no longer matches reality | **Low** | §2 |
| P7 | 3 AdSense slots per article page (ProductReview, NewsroomArticle), one of which self-injects a second script tag | **Medium** | §5 |
| P8 | Feed/grid images (ReviewsGrid, NewsroomFeed) lack explicit width/height → CLS risk | **Medium** | §8 |
| P9 | `index.html`'s `<meta http-equiv="Cache-Control" content="no-store...">` is vestigial/contradicts the real HTTP caching headers already configured in `vercel.json` | **Low** | §6 |
| P10 | `src/components/ui/chart.tsx` (a recharts wrapper) is dead code — zero importers | **Low** | §2 |
| P11 | Single monolithic Tailwind CSS bundle, no per-route CSS splitting (pre-existing, already documented as a known/accepted limitation) | **Low** (informational) | §6 |
| P12 | ~54 MB of podcast audio ships in `public/` uncompressed (deploy-artifact size, not page-load — confirmed not fetched until playback) | **Low** (deploy only) | §4 |

---

## 2. Bundle analysis (real build data)

A real `npx vite build` was run against this branch (not estimated). Full Rollup output confirms:

**Every route pays a fixed JS floor of ~721 KB gzip (~2.47 MB raw) before any route-specific code loads**, because `dist/index.html` references:

```
index-[hash].js          478.80 KB gzip (1,652.78 KB raw)   — main/app-shell chunk, every route
vendor-charts-[hash].js  115.97 KB gzip (  431.67 KB raw)   — recharts, modulepreloaded on EVERY route
vendor-pdf-[hash].js     126.75 KB gzip (  386.84 KB raw)   — jspdf, modulepreloaded on EVERY route
```

**Root cause:** `src/pages/Index.tsx` — the homepage, the *only* route in `src/App.tsx` that is not `React.lazy()`-wrapped — statically imports `src/components/AIFormulator.tsx` (Index.tsx:7) and renders it mid-page (Index.tsx:104), below the fold. That component statically imports:
- `ai-formulator/ConfidencePanel.tsx` (AIFormulator.tsx:48) → `recharts`
- `lib/generateSkincarePdf.ts` (AIFormulator.tsx:31) → `jspdf`
- Several `ai-formulator/*` subcomponents → `framer-motion`

Because Rollup's `manualChunks` (`vite.config.ts:31-35`) put `recharts`/`jspdf` in their own files, they're technically "split" — but since they're statically reachable from the eager entry graph, Vite emits `<link rel="modulepreload">` for them in `index.html`, so they load on **every** route regardless of whether that route ever touches charts or PDFs. The `/skynn-ai` route's own lazy chunk is a deceptively tiny 2.21 KB gzip — its `React.lazy()` wrapper achieves nothing because the heavy code was already forced into the main bundle by the homepage.

**Second cause:** `src/App.tsx:13-14` eagerly (non-lazy) import `Preloader` and `PodcastPlayerProvider`, both rendered on every route before/around the router (`App.tsx:88,186`). `Preloader.tsx` imports `framer-motion` (`AnimatePresence`, `motion`, `useReducedMotion`) and `embla-carousel-autoplay` + the `Carousel` primitive. Neither `framer-motion` nor `embla-carousel*` has a `manualChunks` entry, so both are absorbed directly into the 478.80 KB main chunk, indistinguishable from core app code, on every route including static legal pages.

**Dead manualChunk:** `vendor-date` (`vite.config.ts:34`) produces an empty 0-byte chunk. `grep -rn "date-fns" src/` returns zero direct imports — `date-fns` is only a transitive dependency of `react-day-picker` (`ui/calendar.tsx`). The manualChunks comment ("date formatting everywhere") no longer matches the codebase.

**Dead code:** `src/components/ui/chart.tsx` (a recharts wrapper) has zero importers anywhere in `src/`.

**What's already correct and should not be touched:** `lucide-react` is universally tree-shaken (180/180 usages are named imports, confirmed by grep — no barrel import risk). `react-markdown`+`remark-gfm` (49.01 KB gzip) is cleanly isolated behind the lazy `/briefings/:slug` route. Every admin/dashboard-only use of recharts/jspdf (AnalyticsTab, BillingTab, AccountTab) is correctly behind its own lazy route and contributes nothing to the shared floor — the problem is specifically the homepage's eager render, not a systemic pattern.

---

## 3. Route-by-route JavaScript dependency map

| Route(s) | Lazy? | Extra JS beyond the shared floor | Notes |
|---|---|---|---|
| `/` (Index) | **No — eager** | 0 KB extra (it's the *source* of the shared floor) | Pulls recharts+jspdf+framer-motion+embla into the main chunk; see §2 |
| `/skynn-ai` (AIFormulator) | Yes (wrapper only) | 2.21 KB gzip | Misleadingly small — real weight already paid by `/` |
| `/briefings/:slug` (NewsroomArticle) | Yes | 49.01 KB gzip (react-markdown) | Clean, correctly isolated |
| `/dashboard` (UserDashboard) | Yes | 26.39 KB gzip | Uses jspdf (already in shared floor) + recharts (AnalyticsTab-adjacent) |
| `/shop` (Openhaus) | Yes | 23.98 KB gzip | Uses zod directly |
| `/brand-ambassadors` | Yes | 13.19 KB gzip | — |
| `/partners` | Yes | 10.95 KB gzip | framer-motion already paid for in main chunk, so incrementally cheap |
| `/consult` (DermatologistDirectory) | Yes | 10.45 KB gzip | — |
| `/admin` (AdminDashboard) | Yes | 10.16 KB gzip | Uses recharts (AnalyticsTab) — already in shared floor regardless |
| All other lazy routes (~35 routes) | Yes | Small, route-specific | Correctly split; not a concern |
| `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, etc. (static legal pages) | Yes | ~1-3 KB | Still pay the full **721 KB gzip shared floor** despite containing zero charts, PDFs, or animation |

**Total build output:** 106 JS chunks, ~4.0 MB raw / ~1.18 MB gzip combined. The shared floor (§2) is ~61% of total gzip weight across the entire site.

---

## 4. Image / font asset inventory

### Fonts
`index.html:28` loads a single synchronous, render-blocking Google Fonts stylesheet requesting **4 families, 15 weight/style combinations**: Inter (4 weights), Lora (4 weights), Space Mono (2 weights), Montserrat (5 weights). `display=swap` is present (no invisible-text/FOIT risk), and two `<link rel="preconnect">` hints precede it (`index.html:26-27`), but the CSS-then-font two-hop fetch is still an extra render-blocking round trip.

Actual usage (grepped against `tailwind.config.ts`'s `fontFamily` mapping):
- `font-heading` (Montserrat): 280 hits / 115 files — heavily used, justified.
- `font-sans` (Inter): the real body-copy workhorse (Tailwind preflight applies it by default).
- `font-mono` (Space Mono): only 12 hits / 8 files, mostly incidental (`<kbd>` hints, chart tooltips) — only the 400 weight is actually needed; the 700 weight is dead.
- `font-serif` (Lora): **1 match in the entire `src/` tree, and it's Lora's own CSS variable definition** (`src/index.css:59`). Lora is never applied to any element. All 4 Lora weights are fetched on every page load for a typeface that renders nowhere.

No self-hosted font files exist anywhere in the repo (`public/`, `src/assets/`) — all font delivery depends on the Google Fonts round trip.

### Images
`public/` totals **83 MB**. The largest non-audio assets are photographic content stored as PNG rather than JPEG/WebP:
- `public/podcast/ep4-ingredient-drama.png` (2.1 MB), `ep8-skin-barrier.png` (1.9 MB), `ep6-...png` (1.9 MB), `ep9-...png` (1.8 MB), plus 4 more podcast-cover PNGs in the 1.2–1.3 MB range.
- `public/og-image.png` (780 KB), `public/og-brand-ambassadors.jpg` (452 KB).
- ~18 files under `public/brandbanners/*.PNG`, 300–352 KB each (~5.9 MB combined), all uppercase `.PNG`, none WebP.

`scripts/compress-images.ts` only re-encodes `public/` files >150 KB and keeps the re-encode only if it's ≥10% smaller (sharp, quality 78-80) — it **never converts format**, so photographic PNGs stay PNG-encoded, which is inherently larger than JPEG/WebP at equivalent visual quality. `vite-plugin-image-optimizer` (`vite.config.ts:66-77`) covers only `src/assets/` imports processed by Rollup, same-format-only, no responsive `srcset` generation either.

None of the largest images are above-the-fold on the homepage — the Hero renders no `<img>` at all (see §7). The brand-banner/podcast PNGs load only on their respective secondary pages (Openhaus/Partners/Podcast).

### Podcast audio (deploy-artifact size, not page-load)
`public/*.mp3`/`*.m4a` total ~54 MB (confirmed: ep10 7.3 MB, ep6 6.7 MB, ep7 5.4 MB, ep5 5.3 MB, ep9 4.6 MB, ep8 4.0 MB, ep2 3.8 MB, ep4 3.4 MB, ep1/ep3 2.3 MB each, pouches.m4a 8.9 MB). These are referenced only via `<audio src>` on podcast pages and are **not fetched on any page load** — confirmed no route eagerly imports or preloads them. This inflates deploy-artifact/CDN storage footprint (already documented in CLAUDE.md as a known gap awaiting a working `ffmpeg` toolchain), not runtime page performance — kept as Low priority here.

---

## 5. Third-party script inventory

| Script | Loads on | Async/defer? | Risk |
|---|---|---|---|
| Google Fonts CSS (`index.html:28`) | Every page | Synchronous `<link rel="stylesheet">` | Render-blocking — see §4 |
| Google AdSense loader (`index.html:35`) | Every page | `async` | Low direct blocking risk; downstream ad iframes/creatives are heavier and layout-shifting once they render |
| `AdSlot.tsx` (`<ins class="adsbygoogle">`, pushes on mount) | ProductReview (2×), NewsroomArticle (2×), Index (4× compact slots) | Follows AdSense's own async loader | Standard AdSense pattern |
| `AdSlotAutorelaxed.tsx` | ProductReview (1×), NewsroomArticle (1×) | **Self-injects a second `<script>` tag** via `document.createElement("script")` if not already present (`AdSlotAutorelaxed.tsx:26-29`) | Extra network request + parse cost on top of the base AdSense loader, only on article-type pages |
| Vercel Analytics + Speed Insights (`App.tsx:10-11,194-195`) | Every page | Async by design (official lightweight beacons) | Low risk |
| Calendly booking widget (`CalendlyBooking.tsx:62`) | `/partners` only | iframe | Isolated, not global |

**Confirmed article-page ad load:** ProductReview.tsx renders 3 ad slots (`product-review-top`, `product-review-mid`, autorelaxed `product-review-discussion`); NewsroomArticle.tsx renders 3 (`briefing-top`, `briefing-bottom`, autorelaxed `briefing-footer`). No PayFast/PayPal SDK script injection, no GTM/gtag/Hotjar/Intercom/chat-widget scripts found beyond what's listed above.

---

## 6. Critical rendering path analysis

1. `index.html` head: charset → viewport → 4 cache-control-related `<meta http-equiv>` tags (see P9 below) → title/author → font preconnects + render-blocking Google Fonts stylesheet → Supabase/Unsplash preconnects → AdSense async script → theme-color → favicons. No `<link rel="preload">` for any font file or LCP asset.
2. `main.tsx` mounts via `createRoot` (not `hydrateRoot`) for the plain SPA build — meaning the prerendered/SSR HTML that exists for some routes (see §13) is fully replaced by a client render rather than hydrated, discarding any head-start the static HTML gave first paint (already documented in CLAUDE.md's dark-mode section as a known tradeoff of this architecture; re-confirmed here as directly relevant to FCP/LCP for the prerendered routes specifically).
3. `App.tsx` renders, outside any route boundary: `Preloader`, `ScrollToTop`, `FloatingBottomNav`, `CookieConsent`, `AdBlockNotice` — all mounted before the `Suspense`-wrapped `<Routes>`. Of these, only `Preloader` pulls heavy dependencies (framer-motion + embla); the rest (`ScrollToTop`, `AdBlockNotice`, `FloatingBottomNav`, `CookieConsent`) were checked and are lightweight (no animation/heavy-lib imports).
4. **`Preloader.tsx` renders a `fixed inset-0 z-[100]` full-viewport overlay on top of everything for up to `LOADING_TIMEOUT_MS = 1800`ms (`Preloader.tsx:91`) on the very first pageload of every browser session** (gated only by `sessionStorage`, not by route) — see full detail in §7/§9. This is the dominant critical-rendering-path issue in the codebase.
5. Tailwind emits one monolithic JIT-purged stylesheet (`src/index.css`, 9,049 bytes source) from the single `import "./index.css"` in `main.tsx` — `vite.config.ts:40-46`'s own comment already documents that `cssCodeSplit: true` doesn't actually split CSS per-route under this Tailwind setup, since content scanning is codebase-wide. This is a pre-existing, already-acknowledged architectural tradeoff, not a regression — flagged here as informational (P11), not actionable without a larger CSS-delivery change that's out of this audit's stated scope (no framework/design-system changes).
6. `index.html:8` sets `<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0">`. Modern browsers largely ignore `meta http-equiv Cache-Control` for actual network-level HTTP caching (real caching is governed by the `Cache-Control` HTTP response header, which `vercel.json` already sets correctly per-route per CLAUDE.md's documented 2026-09-22 caching pass: `s-maxage=120, stale-while-revalidate=604800` for SSR routes, `max-age=31536000, immutable` for `/assets/`). This meta tag is vestigial in practice but directly contradicts the real, working HTTP headers in intent, and could confuse any HTTP client or older browser that *does* still respect it, or a caching proxy/agent that reads document meta rather than headers. Low risk to remove, near-zero risk of regression since the real caching contract lives in `vercel.json`.

---

## 7. LCP candidate analysis

**Two compounding LCP problems, in sequence, on the homepage:**

1. **The Preloader splash (§9) is itself very likely the first Largest Contentful Paint candidate** on a fresh session: it's a `fixed inset-0` full-viewport element with a centered 250px logo image, painted immediately and remaining the only visible content for up to 1.8 seconds. Real page content (Hero, headline, etc.) is present in the DOM underneath but visually obscured, and — critically — **this splash is not excluded for bot/Lighthouse traffic**. The `BOT_UA_PATTERN` regex (`Preloader.tsx:99`, which does include `lighthouse` and `headlesschrome`) is only consulted by `isExternalArrival()`, which gates the *second* overlay (the "gate" pricing carousel) — it is never checked for the `showLoading` splash itself. This means **a fresh, cold-sessionStorage Lighthouse run will see the full 1.6–1.8s blocking splash**, directly and severely inflating measured LCP/FCP/TBT on every audit run, not just for real first-time visitors.

2. **Once the splash clears, the homepage's actual background is an autoplaying `<video>` with no `poster` attribute** (`src/components/Hero.tsx:68-79`): `<video autoPlay muted loop playsInline preload="auto" src={videoSrc} .../>`. `videoSrc` is chosen **at runtime via client-side JavaScript**, randomly, from 20 candidates (`src/data/heroVideos.ts:16-38`) — 1 bundled local clip plus 19 remote clips served from `videos.pexels.com`, several at UHD/4K resolution based on filename. Because the choice is made in JS after mount, the browser's preload scanner cannot discover or prioritize this asset from the raw HTML, and no `<link rel="preload">`/`fetchpriority="high"` hint is possible for a resource whose URL isn't known until JS executes. `preload="auto"` on a multi-MB video competes for bandwidth with everything else needed for first render. Without a `poster`, there is no visual placeholder until the video buffers enough to paint a frame — only CSS gradient overlays (`Hero.tsx:80-81`) sit behind it. Depending on how Chrome's LCP heuristic treats a poster-less `<video>` element, the actual LCP candidate likely falls through to the `<h1>` text (`Hero.tsx:96`, "Skincare, without the nonsense."), which is itself gated behind the Google Fonts round-trip (§4) for `font-heading` (Montserrat).

**Affected files:** `src/components/Preloader.tsx`, `src/components/Hero.tsx`, `src/data/heroVideos.ts`, `index.html` (font stylesheet).

**Recommended change:** (a) Exclude `showLoading` splash for `BOT_UA_PATTERN` matches and `navigator.webdriver`, matching the pattern already used for the gate overlay; consider shortening `LOADING_TIMEOUT_MS`; consider not showing the loading splash at all for direct (non-homepage) deep links, since a visitor arriving at `/reviews/some-product` from Google gains nothing from a branded homepage-style splash. (b) Add a `poster` attribute to the hero `<video>` (a static frame or brand image) so there's an immediate paint target, and consider selecting the hero video server-side/deterministically (e.g. by day) rather than client-random so it can be referenced in the initial HTML and hinted with `<link rel="preload" as="video">` or at minimum `fetchpriority="high"`; alternatively serve a `poster` sized/compressed specifically to qualify as a fast LCP image while the video streams in behind it.

**Expected benefit:** Directly addresses LCP, FCP, and TBT — the three metrics most likely dragging down a mobile Lighthouse score.

**Risk:** Low for the bot-exclusion and poster-image changes (additive, no visual regression for real users). Medium for changing hero-video selection logic if "one random clip per visit" is a deliberate brand-freshness decision — confirm with a human before making the video deterministic; the poster-image addition alone is safe regardless.

**Verification method:** Lighthouse mobile run (cold cache, cleared sessionStorage) before/after; WebPageTest filmstrip to visually confirm what paints first; Chrome DevTools Performance panel LCP marker to confirm which element Chrome actually selects as the LCP candidate before and after the poster is added.

---

## 8. CLS risk analysis

- **`ReviewsGrid.tsx:148-153`** and **`NewsroomFeed.tsx:42-51`** product/article card images use `loading="lazy"` (correct, since these are below-the-fold grid items) but **no explicit `width`/`height` attributes** — CLS is only partially mitigated by a fixed-height Tailwind class (`h-40`) on the image wrapper, not by intrinsic image dimensions, so any layout using these components without an equivalent fixed-height wrapper is exposed to shift.
- **`NewsroomFeed.tsx`**'s `BriefingCover` can resolve to a remote Unsplash/Pexels fallback fetched client-side via `useUnsplashImage` (`NewsroomFeed.tsx:39` calls out to the hook) — this adds a request waterfall (article data → Unsplash API → image) rather than a single deterministic image URL, which both delays paint and increases the chance the final image size differs from any placeholder.
- **The Preloader splash and gate overlays** (§7, §9) are themselves a scripted full-viewport insert/removal — while they don't shift layout in the traditional sense (they're `fixed`, out of flow), their abrupt appear/disappear over real content is a jarring visual discontinuity worth the same scrutiny as a layout shift, even if it doesn't register in the CLS metric numerically.
- **Ad slots** (§5): AdSense creatives render into fixed-size `<ins>` containers per `AdSlot.tsx`'s standard pattern, which is the correct anti-CLS approach *if* the container has a reserved size before the ad loads — not independently re-verified in this pass beyond confirming the component follows the standard AdSense pattern; worth a targeted follow-up check of `AdSlot.tsx`'s container CSS specifically.

**Recommended change:** Add explicit `width`/`height` (or `aspect-ratio` CSS, matching the existing Tailwind-driven sizing convention already used elsewhere in the codebase) to the `<img>` elements in `ReviewsGrid.tsx` and `NewsroomFeed.tsx`.

**Expected benefit:** Removes residual CLS risk on the two highest-traffic list/grid views (reviews and briefings), and gives the browser an intrinsic-size hint even before the `h-40` wrapper's CSS is parsed.

**Risk:** Very low — purely additive HTML attributes, no visual change when the existing fixed-height wrapper is present.

**Verification method:** Lighthouse CLS score before/after on `/reviews` and `/briefings`; manual scroll-through with DevTools' "Layout Shift Regions" overlay enabled.

---

## 9. INP / main-thread analysis

The dominant main-thread cost on first load is the same root cause as §2/§7: **~721 KB gzip of JavaScript (main chunk + vendor-charts + vendor-pdf) must be downloaded, parsed, and evaluated on every route before the page is interactive**, most of which (recharts, jspdf, much of framer-motion/embla) is not needed until/unless a visitor scrolls to and interacts with the homepage's SKYNN AI widget specifically.

Additionally:
- **`Preloader.tsx`** runs non-trivial synchronous work at module-eval and mount time on every route: it computes `buildDailyReviewSlides()`, `buildEvergreenSlides()`, `buildAmbassadorSlide()` (date/rotation logic over the full `productReviews`/`comparisonArticles`/`seasonHubs` datasets) and instantiates an `embla-carousel-autoplay` plugin (`Preloader.tsx:122`) — all before the visitor has necessarily even reached the homepage, since this runs on every route, not just `/`.
- **`framer-motion`'s `AnimatePresence`/`motion` components** are active in the component tree on every route via `Preloader` and `PodcastPlayerProvider`, adding continuous animation-frame work during the splash/gate transitions specifically, and general framer-motion overhead (even when idle) on every other page.

**Recommended change:** Defer the AIFormulator subtree (§2/§16 P2) and reduce the Preloader's always-on cost (§16 P1) — both changes directly reduce main-thread JS execution time, which is the primary driver of INP/TBT here more than any single slow event handler.

**Expected benefit:** Lower Total Blocking Time and improved INP, especially on mid-tier Android devices where this codebase's mobile audience is most likely to feel a ~2.5 MB raw JS parse/eval cost.

**Risk:** Low-medium, same as the corresponding Top 10 items — see §16 for full risk notes per change.

**Verification method:** Chrome DevTools Performance panel "Main" thread flame chart on a throttled (4x CPU slowdown, Slow 4G) mobile emulation profile, before/after, on `/privacy-policy` specifically (a route with zero legitimate reason to execute chart/PDF/animation code) to isolate the shared-floor cost from route-specific work.

---

## 10. Hydration / rendering bottlenecks

- The plain SPA build mounts via `createRoot` (`main.tsx:23`), not `hydrateRoot` — confirmed no hydration mismatch risk for the SPA build itself, but this also means the TanStack Start SSR routes (`/reviews/:slug`, `/ingredients/:slug`, `/briefings/:slug`, `/spotlight/:slug`) and the build-time prerendered static HTML for other routes are **discarded and fully re-rendered client-side** rather than hydrated — the visitor sees a flash of the static content, then a full client re-render. This is a pre-existing, already-documented architectural characteristic (see CLAUDE.md's dark-mode section), not a new finding, but it directly bears on why SSR/prerendering here helps crawlability (§13) far more than it helps perceived interactivity speed for real visitors.
- **Layered on top of that discard-and-rerender behavior**, the Preloader's `showLoading` overlay (§7/§9) re-appears on top of already-painted SSR/prerendered content on a fresh session, meaning a visitor who lands directly on a prerendered `/reviews/:slug` page can see real article content flash into view and then get covered by the splash for up to 1.8s before the client SPA takes over — a compounding, visitor-visible regression unique to the intersection of these two systems.
- `src/routes/briefings.$slug.tsx` (the SSR twin of `NewsroomArticle.tsx`) is confirmed by the SEO/crawlability research pass (§13) and CLAUDE.md's own documented history to not render the full article body — a pre-existing, already-flagged gap, out of scope for this audit to re-litigate but noted here since it's directly relevant to hydration/rendering completeness for that specific route.

**Recommended change:** See §16 P1 (Preloader). No separate hydration-specific fix is recommended beyond that — the `createRoot`-over-`hydrateRoot` architecture is a known, accepted tradeoff per CLAUDE.md and changing it would be a meaningful architectural shift outside this audit's no-redesign mandate.

**Expected benefit:** Fixing the Preloader overlap directly removes the "flash of real content, then get covered" regression on every SSR/prerendered route.

**Risk:** Low (same change as P1).

**Verification method:** Load `/reviews/:slug` directly (not via in-app navigation) with a cleared `sessionStorage`, screen-record the first 2 seconds, confirm no content-then-splash flash.

---

## 11. Agentic browsing / accessibility-tree issues

*(Full detail cross-referenced against §12; this section lists issues specifically relevant to a browser agent's ability to identify and act on controls via the accessibility tree — accessible names, predictable semantics, and confident click targets.)*

- **`src/components/marketplace/MarketplaceProductCard.tsx:35-43`** — the wishlist "Heart" icon button has **no text and no `aria-label`**, so it has zero accessible name for AT or an agent parsing the tree. The same file also nests this button (plus an "Add to bag" button, `MarketplaceProductCard.tsx:57-66`) **inside a `<Link>`** (line 23) — invalid interactive-in-interactive HTML nesting that browsers silently "fix" by hoisting, producing unpredictable tab order and an unreliable click target for both AT and agentic automation. This card renders on 4+ marketplace surfaces (grid, landing, saved, product detail), so the scope is sitewide across the marketplace section. (A duplicate pattern exists in `src/components/ProductCard.tsx`, but that file is confirmed dead code — not imported anywhere.)
- **Ambiguous, repeated link text**: `NewsroomFeed.tsx:339-345` ("Read the breakdown") and `ReviewsGrid.tsx:237-238` ("Full breakdown") carry no `aria-label` naming the specific article/product. In `ReviewsGrid.tsx` specifically, the product title (`h3`, line 175-177) is plain text, not a link, so "Full breakdown" is the *only* link into that card — an agent building a link-text-based action list (or a screen-reader "links list") sees the identical string repeated once per card in the grid, with no way to distinguish which product each one targets without also parsing surrounding visual context.
- **3 isolated icon-only buttons missing `aria-label`**: `MaintenanceModal.tsx:212-218` (dismiss X), `MFASettingsCard.tsx:144` (copy-secret), `dashboard/BillingTab.tsx:206` (invoice download). Low sitewide scope (3 instances) but each is a genuine dead-end for an agent trying to identify the control's purpose from the tree alone.
- **Positive finding, worth preserving:** zero `<div onClick>`/`<span onClick>` instances exist anywhere in `src/` (all 34 `onClick` handlers adjacent to a div/span were verified to actually live on a real nested `<Button>`/`<button>`), and the site search is genuinely `cmdk`-based (`SiteSearch.tsx`), giving correct combobox/listbox ARIA semantics for free. Do not regress either of these in future work.

**Recommended change:** Add `aria-label` to the wishlist button and un-nest it (and "Add to bag") from the enclosing `<Link>` — wrap the image/title in the `<Link>` and keep the action buttons as siblings, not descendants, matching the pattern already used correctly elsewhere in the codebase (per the accessibility research pass, this exact "real anchor, siblings not descendants" pattern is already the norm in 34/34 other interactive-card instances checked). Add `aria-label={`Full breakdown: ${review.product_name}`}` / `aria-label={`Read the breakdown: ${article.title}`}` to the two ambiguous CTAs. Add `aria-label` to the 3 isolated icon buttons.

**Expected benefit:** Every interactive control on the highest-traffic card/grid surfaces (reviews, briefings, marketplace) becomes independently identifiable and actionable by an agent or AT without visual context — directly serving objective B ("descriptive link text", "predictable interactive controls").

**Risk:** Very low — additive ARIA attributes and a markup restructure (button nesting) that doesn't change visual output or existing click behavior.

**Verification method:** Chrome DevTools Accessibility Tree inspector on `/reviews`, `/briefings`, and `/marketplace` before/after; axe-core or Lighthouse accessibility audit score; manually tab through a marketplace product card to confirm the wishlist/add-to-bag buttons are reachable in a sane order outside the anchor.

---

## 12. Semantic HTML issues

- **Landmark inconsistency**: `Header.tsx` has a real `<header>` (line 229) and a real `<nav aria-label="Primary">` for the *mobile* sheet only (line 382) — the desktop mega-menu (`DesktopMenuPanel`, lines 134-198) is a plain `<div>` of real `<Link>`s, not wrapped in `<nav>`. `Footer.tsx` has a real `<footer>` (line 82) but its three link columns (lines 125-177) are `<div><h4>...<ul><li><Link>`, not wrapped in `<nav aria-label="...">` — inconsistent with the header's own `aria-label="Primary"` precedent, which exists specifically to help disambiguate multiple navs on a page.
- **`<main>` coverage**: 45/47 page files correctly wrap content in `<main>`. Two exceptions: `src/pages/NotFound.tsx` and `src/pages/SmartRoutines.tsx`. Low severity (2/47), but both are easy, isolated fixes.
- **Heading hierarchy**: spot-checked pages (Index/Hero, ProductReview, IngredientDetail, NewsroomArticle, KnowledgeHub) all render exactly one `<h1>` per actual page state. A broader grep flagged 15 page files with h1-count ≠ 1, but manual verification confirmed these are mutually exclusive conditional branches (e.g. a "not found" error state vs. the loaded-content state) — only one `<h1>` ever renders at runtime. **No real duplication bug**, but worth knowing before trusting a raw grep count on this codebase again.
- **Form label association**: `src/pages/Contact.tsx:138-201` uses plain `<label>` elements with **no `htmlFor`**, as siblings of `<input>`/`<textarea>` elements with **no `id`**, across all 5 fields (First/Last Name, Email, Subject, Message). These labels are not programmatically associated with their controls at all — AT announces unlabelled inputs. Errors on this form also only surface via a `sonner` toast, never inline or `role="alert"`, unlike `AuthDialog.tsx` (which correctly uses `Label htmlFor`/`Input id` pairing and `role="alert"` error text throughout, confirmed at lines 266/268, 393/395, 279/440/537). `AuthDialog`'s one remaining gap: its `role="alert"` error `<p>` isn't wired to the field via `aria-describedby`, so it's announced once on appearance but not when tabbing back to the field later.
- **Image alt text**: no `<img>` without an `alt` attribute was found anywhere in a full-codebase scan (~60 usages checked); alt text quality is generally descriptive and context-specific, not generic or filename-based. This is a genuine strength — do not regress it.

**Recommended change:** Wrap Contact.tsx's form fields with correct `htmlFor`/`id` pairing (mirror `AuthDialog.tsx`'s existing pattern exactly — no new pattern needs inventing) and add inline `role="alert"` error text alongside the existing toast. Add `<main>` to `NotFound.tsx` and `SmartRoutines.tsx`. Optionally wrap `Header.tsx`'s desktop menu and `Footer.tsx`'s link columns in `<nav aria-label="...">` to match the mobile nav's existing precedent.

**Expected benefit:** Contact.tsx becomes a genuinely usable form for AT users (currently a real blocker on a public conversion-relevant form, not a cosmetic gap); consistent landmark structure improves both AT and agentic page-structure parsing sitewide.

**Risk:** Low — Contact.tsx and the `<main>` additions are copy-the-existing-pattern changes with no visual impact. The nav-wrapping change is slightly broader (touches every page via Header/Footer) but is purely additive markup.

**Verification method:** axe-core/Lighthouse accessibility score on `/contact`, `/404` (NotFound), and `/routines` (SmartRoutines) before/after; manual screen-reader (VoiceOver/NVDA) pass on the Contact form specifically to confirm each field's label is announced.

---

## 13. Crawlability / indexability issues

- **The entire marketplace product/brand catalog is a crawler/agent dead-end.** `src/routes/sitemap[.]xml.ts` queries Supabase live and lists `/marketplace/product/:slug` and `/marketplace/brand/:slug` URLs (potentially dozens-to-hundreds of pages) in the sitemap, but **none of these have a TanStack SSR route or a `scripts/prerender.ts` entry** — cross-referenced directly against `prerender.ts`'s `STATIC_ROUTES` list and the 4 SSR route files, confirmed absent from both. `public/robots.txt` explicitly welcomes GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-SearchBot, anthropic-ai, and PerplexityBot by name (lines documenting per-bot allow rules) — none of which are guaranteed to execute client JavaScript — meaning the site is actively inviting exactly the agent traffic this audit's objective B cares about into a section of the site that renders as an empty shell for them. This is the single highest-impact crawlability/agentic-discoverability gap found.
- **9 static routes are listed in the live sitemap but absent from `prerender.ts`'s `STATIC_ROUTES`**: `/marketplace`, `/marketplace/brands`, `/marketplace/categories`, `/marketplace/shipping-returns`, `/marketplace/terms`, `/whitepapers`, `/refund-policy`, `/editorial-policy`, `/community-guidelines`. These are discoverable via the sitemap but render SPA-only.
- **8 orphaned routes** are in neither the sitemap nor `prerender.ts`, discoverable only by following an in-app link (no direct crawl entry point at all): `/marketplace/values/:slug`, `/marketplace/skin-tone/:band`, `/routines` (SmartRoutines), `/learn` (ComingSoon), `/reviews/page/:page`, `/advertising-policy`, `/corrections-removals`, `/brand-ambassadors/apply`.
- **`NotFound.tsx` likely returns HTTP 200, not 404**, for unmatched URLs (inferred, not confirmed live — see verification method below). It's reached purely via React Router's client-side `<Route path="*">` with no server-side status-setting call found in any SSR route file or `scripts/assemble-vercel-output.ts`'s catch-all, which routes unmatched paths either to the SSR function or to `dest: "/index.html", check: true` (an explicit 200 SPA-shell fallback). A soft-404 (200 status, "not found" content) is a well-known SEO/crawlability anti-pattern that can cause search engines to index a generic error page under many URLs.
- `public/robots.txt` itself is otherwise in good shape: explicit, correctly-scoped per-bot rules plus a catch-all `User-agent: *` fallback, `Disallow: /admin` + `/dashboard`, and a sitemap reference matching `SITE_URL` exactly. No disallow needed for `/quote-ss-beauty` or `/reset-password` since both rely on `noindex` (the correct pattern — blocking via robots would prevent a crawler from ever seeing the noindex tag in the first place).

**Recommended change:** Extend either the TanStack SSR layer or `scripts/prerender.ts` to cover marketplace product/brand pages (the existing `/reviews/:slug` SSR route is a directly reusable pattern — same "real, sourced, provenance-tracked catalog data rendered server-side" shape). Add the 9 sitemap-but-not-prerendered static routes to `prerender.ts`'s `STATIC_ROUTES` list (pure config addition, no new code pattern). Add the 8 orphaned routes to the sitemap and/or prerender list per whether they're meant to be publicly discoverable (`/learn` being `ComingSoon` may be intentionally unlisted — confirm with a human before adding). Confirm and, if needed, fix `NotFound.tsx`'s HTTP status.

**Expected benefit:** Directly serves objective B's "crawlability" and "discoverability of important public routes" goals; the marketplace fix in particular closes a real, currently-invited gap between what `robots.txt` welcomes and what the SSR/prerender layer actually supports.

**Risk:** Low for the `prerender.ts` static-route additions (pure config, copies an existing working pattern). Medium for the marketplace SSR extension (new route files, though directly modeled on the existing `reviews.$slug.tsx` pattern — CLAUDE.md's own SEO section already establishes this as the template to copy). Low-medium for the 404 status fix (needs to confirm the fix doesn't break the SPA's client-side catch-all UX for in-app "soft" 404s, e.g. an unresolved ingredient slug).

**Verification method:** `curl -I` against a live/preview marketplace product URL and a known-bad URL (e.g. `/this-does-not-exist`) to check actual HTTP status codes; Google Search Console's URL Inspection tool (or a crawler simulation with JS disabled) against a marketplace product page before/after to confirm real content appears in the raw HTML response.

---

## 14. Structured-data issues

- **Dual SEO/JSON-LD emission risk.** `SitewideSEO.tsx` (rendered globally, outside `<Routes>`, `App.tsx:169`) pattern-matches the current pathname and independently renders its own `<SEO>` + JSON-LD for reviews, briefings, comparisons, podcast episodes, FAQ entries, and seasons — while the page components themselves (`ProductReview.tsx`, `KnowledgeHub.tsx`, etc.) *also* render their own `<SEO>`/JSON-LD. Since react-helmet-async does not dedupe `<script type="application/ld+json">` by content, both sources mount simultaneously on routes like `/reviews/:slug`, `/knowledge-hub/:slug`, `/briefings/:slug`, `/podcast/:slug`, and `/reviews/versus/:slug` — resulting in **duplicate JSON-LD blocks** and a title/canonical/meta outcome that depends fragilely on DOM mount order rather than a single source of truth.
- **Only 17 of 48 page files render `<SEO>` directly**; the other 31 use raw `<Helmet>` calls or rely solely on `SitewideSEO.tsx`'s lookup table (`src/lib/seo-config.ts`), which has **no per-page JSON-LD at all** for several routes (e.g. `/about`, `/business`, `/partners`, `/consultations` — meta tags only, no structured data).
- **`MarketplaceProductDetail.tsx:80-127` hand-rolls its own inline Product+BreadcrumbList JSON-LD** rather than reusing the shared `src/lib/seo/jsonLd.ts` builders that every other content type uses — combined with §13's finding that this page isn't SSR'd, the schema currently exists only after client JS executes, which defeats the purpose of structured data for a non-JS crawler entirely.
- **Podcast episode pages have no dedicated per-page structured-data ownership** — `EpisodePage.tsx`/`PodcastPage.tsx` render neither `<SEO>` nor a direct `jsonLd.ts` builder call; the only `PodcastEpisode` schema comes from `SitewideSEO.tsx`'s pathname pattern-match, and only when the episode isn't `comingSoon`.
- **Positive finding:** breadcrumbs (both visual, via `ui/breadcrumb.tsx`/`MarketplaceBreadcrumbs.tsx`, and JSON-LD via `breadcrumbJsonLd()`) are correctly present across ingredient detail, product review (SSR route), and briefings pages — no gap found there. Internal ingredient links (§15) were also confirmed to survive the paywall UI (`GatedOverlay` blurs but does not remove them from the DOM), meaning structured internal linking isn't accidentally cloaked from crawlers by the membership gate.

**Recommended change:** Establish a single source of truth per route — either have `SitewideSEO.tsx` explicitly skip routes that already render their own `<SEO>` (it would need a way to detect that, e.g. a shared route-registry check), or migrate the remaining page-level JSON-LD calls fully into `SitewideSEO.tsx` and remove the duplicate page-level calls. Given the "no redesign" constraint, the lower-risk direction is likely to make `SitewideSEO.tsx` the sole authority for the 5 route families it already covers and leave page-level `<SEO>` calls only for routes it doesn't. Route `MarketplaceProductDetail.tsx`'s JSON-LD through the shared `jsonLd.ts` builders once that page has SSR coverage (§13).

**Expected benefit:** Eliminates duplicate/conflicting structured data that could cause a search engine or an LLM-based agent parsing JSON-LD to see two different (or contradictory) descriptions of the same page; establishes one auditable source of truth for future changes.

**Risk:** Medium — this touches the metadata rendering path on potentially every route, so it needs careful before/after verification per route family to avoid silently dropping metadata that currently "wins" the DOM-order race by luck.

**Verification method:** For each of the 5 affected route families, load the page and inspect `document.querySelectorAll('script[type="application/ld+json"]')` in DevTools before/after to confirm exactly one block per schema type; Google's Rich Results Test tool against representative URLs of each type.

---

## 15. Internal-linking / discoverability issues

- Confirmed working correctly: `ProductReview.tsx:510-515`'s ingredient-breakdown names render as real `<Link to="/ingredients/:slug">` when resolved (plain `<span>` text when unresolved — no dead links created), and this survives the membership paywall (`GatedOverlay` blurs visually via `aria-hidden` styling but does not remove the links from markup, `GatedOverlay.tsx:34`). `IngredientDetail.tsx:313-328`'s reverse-direction CTA and its SSR twin both use real anchors, not onClick-only navigation.
- **Outbound `rel` attribute gaps**: `rel="sponsored"` is correctly present on `AffiliateAdSlot.tsx` and `FaithfulToNature.tsx`'s outbound links (matching the site's documented disclosed-sponsorship policy), and `rel="nofollow"` is correctly present on citation/source links (`ReviewsGrid.tsx:160`, `SourceCitationList.tsx:22`, `KnowledgeHub.tsx:93`). However, `NotificationBar.tsx:13`'s outbound Takealot link and `ProductReview.tsx:429` / `routes/reviews.$slug.tsx:435`'s external product-source links use only `rel="noopener noreferrer"` — no `sponsored`/`nofollow` — despite being commercial outbound retail links comparable to the ones that already get `rel="sponsored"` elsewhere. Worth a human confirming whether these specific links represent a commercial/affiliate relationship (in which case they need `rel="sponsored"` per the site's own existing policy) or pure editorial citation (in which case they're correctly unmarked).
- This ties directly into §13/§14: the marketplace product/brand catalog being un-crawlable means whatever internal linking exists *into* it (from SKYNN AI recommendations, product reviews' "Shop on OpenHaus" cross-links) currently only benefits users who execute JS — an agent following links structurally, without executing JS, hits the same dead end documented in §13.

**Recommended change:** Confirm the commercial nature of the 3 flagged outbound links with a human and add `rel="sponsored"` if warranted (a one-attribute change, no functional risk). No other internal-linking changes are needed beyond the SSR/prerender fix already recommended in §13, which is what actually unlocks the value of the internal links that already exist.

**Expected benefit:** Correct `rel` attributes keep the site's own disclosed-sponsorship standard consistent and avoid passing undisclosed commercial link equity; closing §13's SSR gap is what actually makes the existing internal-linking work (§15's positive findings) valuable to non-JS crawlers/agents.

**Risk:** Very low (attribute-only change, pending one factual confirmation from a human about which links are commercial).

**Verification method:** Confirm with a human/business owner which of the 3 flagged links are commercial/affiliate relationships; re-check `rel` attributes render correctly in page source after the change.

---

## 16. Top 10 highest-value changes (ranked)

Ranked by (expected performance/SEO/agentic impact) × (implementation confidence) ÷ (risk), per the audit's explicit ranking criteria: expected impact, implementation complexity, risk, and SEO/agentic impact.

| # | Change | Impact | Complexity | Risk | Why it's ranked here |
|---|---|---|---|---|---|
| **1** | **Exclude bot/Lighthouse traffic from the Preloader's `showLoading` splash** (extend the existing `BOT_UA_PATTERN` check — already written and already used for the gate overlay — to also gate `showLoading`); shorten `LOADING_TIMEOUT_MS`; scope the full splash to the homepage rather than every route. `src/components/Preloader.tsx:88-176` | Critical — this single change likely has the largest measured-Lighthouse-score effect of anything in this audit, since cold-cache Lighthouse runs currently see the full 1.8s blocking overlay | Low — the bot-exclusion pattern already exists in the same file for a sibling feature; this is extending, not inventing | Low | §7, §9 |
| **2** | **Lazy-load the homepage's `AIFormulator` widget** (`React.lazy()` + `Suspense`, or an `IntersectionObserver`-gated dynamic `import()` since it's below the fold) and dynamically `import()` `generateSkincarePdf`/`ConfidencePanel` only when the PDF-download/confidence-score step is actually reached. `src/pages/Index.tsx:7,104`, `src/components/AIFormulator.tsx:31,48` | Critical — real build data confirms this removes ~360 KB gzip (`vendor-charts` + `vendor-pdf`) from the shared floor paid by every route on the site | Medium — needs a Suspense fallback that doesn't visually jar against the existing homepage design; the component is 1,560 lines with many sub-imports to verify none leak out | Low — `React.lazy()` is already the established pattern for every other route in this codebase; this is applying an existing pattern, not inventing one | §2, §3 |
| **3** | **Give the Hero background video a `poster` attribute** and reconsider `preload="auto"` for the 19 remote UHD clips. `src/components/Hero.tsx:68-79`, `src/data/heroVideos.ts` | High — directly targets LCP/FCP on the homepage, the site's highest-traffic entry point | Medium — needs a representative static frame per video/brand-appropriate fallback image | Low for the poster addition; Medium if also changing the random-selection-per-visit behavior (confirm intent with a human first) | §7 |
| **4** | **Extend SSR (or prerender) coverage to the marketplace product/brand catalog**, reusing the existing `/reviews/:slug` TanStack Start SSR route as a template. `src/routes/reviews.$slug.tsx` (pattern to copy), new `src/routes/marketplace.product.$slug.tsx` / `marketplace.brand.$slug.tsx` | High — closes the single largest crawlability/agentic-discoverability gap found: an open-ended, sitemap-listed, robots.txt-invited catalog that's currently an empty shell to any non-JS crawler or agent | Medium-High — new route files, though directly modeled on an existing working pattern | Low — the pattern to copy already works in production for reviews/ingredients | §13 |
| **5** | **Drop the unused Lora font family and trim Space Mono to its one used weight** from the Google Fonts URL. `index.html:28` | Medium — removes 4+ unnecessary font-file fetches from a render-blocking request, on every page, every route | Very Low — a one-line URL edit | Very Low — confirmed zero usage of Lora anywhere in `src/` | §4 |
| **6** | **Fix the marketplace wishlist button's accessible name and invalid `<Link>` nesting.** `src/components/marketplace/MarketplaceProductCard.tsx:23,35-43,57-66` | High for objective B specifically — a completely nameless, unpredictably-nested control on a component used across 4+ marketplace surfaces | Low — add `aria-label`, restructure so action buttons are siblings of the `<Link>` rather than descendants (the pattern already used correctly everywhere else in the codebase) | Low | §11 |
| **7** | **Disambiguate the "Full breakdown"/"Read the breakdown" repeated link text** with an `aria-label` naming the specific item. `src/components/ReviewsGrid.tsx:237-238`, `src/components/NewsroomFeed.tsx:339-345` | Medium-High for objective B — makes every card in the two highest-traffic content grids independently identifiable to AT/agents | Very Low — add one `aria-label` per instance | Very Low | §11 |
| **8** | **Convert the ~18 brand-banner PNGs and 8 podcast-cover PNGs to WebP** in `scripts/compress-images.ts` (extend it to convert format for photographic content, not just re-encode same-format) | Medium — meaningfully shrinks ~12 MB of `public/` photographic assets stored in a heavier-than-necessary format | Medium — needs a `<picture>`/fallback strategy or confirmation that WebP-only is acceptable for the target browser support matrix | Low-Medium | §4 |
| **9** | **Add the 9 sitemap-listed-but-not-prerendered static routes to `scripts/prerender.ts`'s `STATIC_ROUTES`** (`/marketplace`, `/marketplace/brands`, `/marketplace/categories`, `/marketplace/shipping-returns`, `/marketplace/terms`, `/whitepapers`, `/refund-policy`, `/editorial-policy`, `/community-guidelines`) | Medium-High for objective B — closes a direct, easily-fixed mismatch between what the sitemap promises and what's actually crawlable | Very Low — pure config-list addition, copies an existing working pattern for every other static route | Very Low | §13 |
| **10** | **Fix `Contact.tsx`'s broken form label association** (add `htmlFor`/`id` pairing, mirroring `AuthDialog.tsx`'s already-correct pattern exactly) plus inline `role="alert"` error text | Medium — a real, currently-broken accessibility blocker on a public conversion-relevant form | Very Low — copies an existing correct pattern from the same codebase | Very Low | §12 |

**Not in the Top 10 but worth a human decision:** resolving the dual SEO/JSON-LD emission (§14) is a meaningful structured-data-correctness fix, but it's ranked below the Top 10 because it's Medium risk (touches metadata rendering on every route) relative to its impact — recommended as the next tranche of work after the Top 10 lands and can be verified in isolation.

---

## Appendix: what was explicitly ruled out

Per this audit's mandate, the following were considered and deliberately **not** recommended:
- **Framework migration** — no evidence found that Vite/React itself is the bottleneck; every finding above traces to application-level code-splitting decisions (an eager homepage import, an always-mounted splash) or asset-delivery choices (font URL, image format, video selection), all fixable within the current architecture.
- **CSS delivery redesign** (per-route critical CSS, CSS-in-JS, etc.) to address the monolithic Tailwind bundle (§6, P11) — flagged as informational only, since fixing it properly would mean changing how Tailwind's content scanning integrates with route-level code splitting, which edges toward the kind of architectural change this audit was asked not to make.
- **Removing the Preloader/gate feature entirely** — it's clearly an intentional product/marketing mechanism (entry-gate carousel promoting content, branded loading screen). The recommendation is to scope and shorten its blocking behavior, not remove it.
- **Changing the Hero video's creative direction** — the recommendation is additive (a poster image) and conditional (confirm before changing the random-per-visit selection logic), not a redesign of the hero treatment itself.
