# SkinLabs® — Agentic Web Audit (post-implementation verification)

**Date:** 2026-09-22
**Scope:** Follow-up to `PERFORMANCE_AGENTIC_AUDIT.md`. That document specified the Top 10 fixes; a same-day implementation pass landed 9 of them plus the P8 CLS fix (documented in its own "Implementation status" section). This document is the promised follow-up: it does not re-propose changes, it **verifies**, with fresh empirical evidence gathered against a real build and a real headless-browser run, that the fixes actually deliver the agentic/AI-crawlability outcome they were meant to — and it surfaces one real regression risk the implementation pass introduced but never tested.

**Methodology:** A clean `npm ci` + `npx vite build` was run against the merged code (matching the original audit's own verification method). For the one finding that couldn't be confirmed from source alone — whether the homepage's now-lazy-loaded SKYNN AI widget still survives into the prerendered HTML a crawler actually receives — a real `vite preview` server was started and driven with `puppeteer-core` against this environment's pre-installed Chromium, replicating `scripts/prerender.ts`'s exact `goto(..., { waitUntil: "domcontentloaded" })` + fixed 1400ms wait sequence, and the resulting HTML was inspected directly rather than assumed. No live Lighthouse/PageSpeed run was performed (same documented constraint as the original audit — no browser-based CI in this environment for that specific tool).

---

## 1. Verified: the JS-floor fix is real, not just theoretical

The original audit projected the shared JS floor would drop from ~721 KB gzip to ~420 KB gzip once the homepage stopped eagerly bundling `recharts`/`jspdf`/`framer-motion`. A fresh build after the merge confirms this landed:

```
dist/assets/index-DQeeeS53.js   1,506.37 kB raw │ gzip: 431.04 kB   — main chunk, every route
```

`grep -o 'modulepreload[^>]*' dist/index.html` returns **zero matches** — the `vendor-charts`/`vendor-pdf` `<link rel="modulepreload">` tags the original audit found in `dist/index.html` are gone entirely. `recharts` (`generateCategoricalChart-*.js`, 100.66 KB gzip) and `jspdf` now live inside `AIFormulator-tJZdzpMT.js` (165.65 KB gzip, includes `framer-motion` too), which is fetched only when a route actually reaches `<Suspense>` around `<AIFormulator />` — confirmed by `src/pages/Index.tsx:112-123`, the only call site. Every other route (including every static legal page) no longer pays for this chunk at all, matching the audit's original diagnosis exactly.

## 2. New finding: the AIFormulator lazy-load created an untested prerender race — verified safe, but worth knowing about

This is the one thing the implementation pass didn't anticipate: **the homepage (`/`) is itself a prerendered route.** `scripts/prerender.ts:103` builds its route set as `new Set(["/", ...STATIC_ROUTES])`, and `scripts/prerender.ts:136` writes the `/` route's captured HTML straight over `dist/index.html` — i.e. what a crawler/agent that doesn't execute JS actually receives for the homepage is whatever Puppeteer captured, not the raw Vite output.

Before this PR, `AIFormulator` was eagerly rendered, so a crawl of `/` always captured its real content. After this PR, reaching it requires an *additional* async hop (fetching and executing its own separate chunk) that didn't exist before. `scripts/prerender.ts:204-205` only waits `domcontentloaded` + a flat, unconditional 1400ms before calling `page.content()` — there's no `waitForSelector`/network-idle check tied to the lazy chunk specifically, so whether the real widget or the `<Suspense>` fallback ("Loading SKYNN AI skin analysis…", `Index.tsx:117`) gets captured is a timing race that nothing in the code guarantees the outcome of.

**Verified empirically, not assumed:** ran a real `vite preview` server and a real headless Chromium session reproducing the prerender script's exact wait sequence:

```
Exact CTA string present: true
---snippet around real CTA---
...gradient-border-anim">Get started for free<svg ...
```

The captured HTML contains the AIFormulator's actual CTA text (`"Get started for free"`, from `src/components/AIFormulator.tsx:920` — a string that only renders once the real component has mounted, not from the Suspense fallback) and **does not** contain the fallback string (`"Loading SKYNN AI skin analysis…"`). Under this environment's local network conditions, 1400ms is comfortably enough for the extra chunk fetch to resolve, and the fix does **not** regress what a crawler/agent sees on `/`.

**Why this is still worth flagging rather than closing silently:** this test was run against a local `vite preview` server with near-zero network latency — the real Vercel build pipeline may see different timing (a colder CDN edge, a larger chunk after future changes to `AIFormulator.tsx`). The 1400ms wait was already a fixed, unconditional value before this PR (used for every route, not added for this fix), so this isn't a new class of risk this PR introduced structurally — but this PR is the first change to make the homepage's *specific* prerender outcome depend on an additional network round-trip it didn't previously need. If the homepage's prerendered snapshot is ever found to be missing the AIFormulator section in production (checkable by fetching `https://skinlabs.co.za/` with a plain HTTP client and grepping for `"Get started for free"` or `"Start My Analysis"`), the fix is either a longer fixed wait or, better, a `page.waitForSelector('[data-ai-formulator-ready]')`-style explicit signal — not something to build speculatively here without evidence it's actually needed.

## 3. Verified: robots.txt / sitemap / prerender are internally consistent for the marketplace withdrawal

The Top-10 implementation withdrew SSR for `/marketplace/*` after discovering every route there is wrapped in a real login gate (`MarketplaceGate`), and instead removed those URLs from both sitemap generators and added them to `robots.txt`'s `Disallow` list. Confirmed all three pieces actually agree with each other post-merge:

- `public/robots.txt` disallows `/marketplace` under every named user-agent block (Googlebot, Bingbot, Twitterbot, facebookexternalhit, and all 7 named AI crawlers — GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-SearchBot, anthropic-ai, PerplexityBot, Google-Extended) plus the catch-all `*` block, with an inline comment explaining why.
- `src/routes/sitemap[.]xml.ts` and `scripts/generate-sitemap.ts` both carry matching comments confirming `/marketplace/*` is intentionally not queried/listed, and `src/lib/sitemap/staticRoutes.ts` documents the same removal.
- `scripts/prerender.ts:82-90` explicitly does **not** add any `/marketplace/*` path to `STATIC_ROUTES`, with the same reasoning inline.

No stale reference to a crawlable `/marketplace` was found anywhere across these three surfaces — a crawler following `robots.txt` correctly never learns these URLs exist in the first place, which is the right outcome for a gated section (advertising a URL only to serve it a "Checking access…" screen is worse for both SEO and agentic trust than not listing it at all).

## 4. Verified: the accessibility/agentic fixes are real, not just described in a commit message

Spot-checked every accessibility-specific Top-10 item directly against the merged source rather than trusting the commit message:

- **Marketplace wishlist button** (`src/components/marketplace/MarketplaceProductCard.tsx`): the action buttons (`aria-label={saved ? "Remove ${product.name} from saved items" : "Save ${product.name} to your wishlist"}` at line 60, `aria-label="Add ${product.name} to bag"` at line 72) are now siblings of the `<Link>` (line 31-54), not descendants — confirmed by reading the JSX structure, not just grepping for `aria-label`. This fixes both the invalid-nesting nested-interactive-control HTML problem and the previously-nameless button.
- **Repeated link text**: `ReviewsGrid.tsx:240` (`aria-label={"Full breakdown: ${review.brand} ${review.product_name}"}`) and `NewsroomFeed.tsx:341` (`aria-label={"Read the breakdown: ${article.title}"}`) both disambiguate per-card, confirmed present.
- **Preloader bot-exclusion**: `src/components/Preloader.tsx:106-116` still gates `showLoading` (not just the older gate overlay) behind `BOT_UA_PATTERN.test(navigator.userAgent)`, `LOADING_TIMEOUT_MS` is `900` (was `1800`), and `Preloader` itself is now `lazy(() => import("./components/Preloader"))` in `src/App.tsx:18` rather than a static import — three independent, all-confirmed parts of item 1, not just one.
- **Contact form labels**: `src/pages/Contact.tsx` pairs every field with `htmlFor`/`id` (e.g. `htmlFor="contact-first-name"` / `id="contact-first-name"` at lines 144/148, and matching pairs for last name, email, subject, message) and inline errors use `role="alert"` (line 215) — confirmed, not just claimed.
- **Font trimming**: Lora is dropped from `index.html`'s Google Fonts URL as claimed. Space Mono's two weights were **not** trimmed to one as the original Top-10 item literally specified — but this is a correct, already-verified deviation, not a missed item: `index.html:34-39`'s own comment states both 400 and 700 are genuinely used, and a direct grep confirms real call sites combining `font-mono` with `font-bold` (`src/pages/DermatologistDirectory.tsx:409`, `src/pages/marketplace/MarketplaceRestrictedAccess.tsx:193`). Trimming to one weight as originally suggested would have broken real bold-monospace UI (stat callouts) — the implementation was right to deviate here.

## 5. Still open, unchanged since the original audit

- **Dual SEO/JSON-LD emission** (§14 of `PERFORMANCE_AGENTIC_AUDIT.md`) — `SitewideSEO.tsx` and page-level `<SEO>` calls can both mount JSON-LD on the same route (`/reviews/:slug`, `/knowledge-hub/:slug`, `/briefings/:slug`, `/podcast/:slug`, `/reviews/versus/:slug`), which react-helmet-async does not dedupe. This was correctly **not** touched in the Top-10 implementation pass (it was explicitly ranked below the Top 10 as Medium risk, needing per-route-family before/after verification). Still recommended as the next tranche of work, not attempted here — it touches metadata rendering on every route and deserves its own isolated pass with the Rich Results Test verification method the original audit specified, not a bundled fix.
- **`MarketplaceProductDetail.tsx`'s inline hand-rolled JSON-LD** (also §14) — unaffected by this PR's marketplace-gating discovery; still worth routing through the shared `src/lib/seo/jsonLd.ts` builders whenever that page's SSR status is revisited.

## 6. Summary

Every one of the 9 implemented Top-10 items plus the P8 CLS fix was independently re-verified against the merged source (not re-trusted from the commit message), and the one new risk the implementation introduced — the homepage prerender's new dependency on an extra async chunk load — was tested empirically rather than left as a theoretical concern, and found to currently resolve safely within the existing fixed wait. No fixes were made in this pass; it is a verification-only document, consistent with the "no speculative optimization" constraint both audits have operated under. The one item both audits agree is the correct next piece of work is the dual JSON-LD emission fix (§14), which needs its own dedicated, carefully-verified pass rather than being folded into either audit after the fact.
