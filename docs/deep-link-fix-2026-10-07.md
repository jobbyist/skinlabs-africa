# Deep-link fix — implementation summary (2026-10-07)

## Problem
Fresh requests to `/briefings/:slug`, `/reviews/:slug`, `/ingredients/:slug` and `/spotlight/:slug` (shared links, bookmarks, push taps, PWA cold starts) rendered a bare TanStack SSR document: no stylesheet, header/footer, SPA or service-worker registration. In-app navigation showed the real SPA page. A push tap while the app sat on one of those pages was lost (no listener).

## Changes
- `src/routes/__root.tsx`, `src/lib/routing/spaShell.ts`: SSR document now carries the SPA shell (hashed entry + CSS from `dist/index.html`) around the SSR content in `#root > [data-ssr-fallback]`; TanStack client bundle not loaded. Fallback hidden for JS users, revealed after 8 s if the app never boots.
- `src/server.ts`, `src/lib/routing/stripClientPreloads.ts`: strips unused TanStack `modulepreload` hints (~260 kB gz).
- `src/lib/seo/head.ts`: SSR head tags carry `data-rh` (adopted by react-helmet-async, no duplicates); no per-route charset/viewport.
- `briefings|reviews|ingredients.$slug.tsx`, `src/router.tsx`: Supabase errors → 5xx + generic error component (logged), not a cached 404.
- `src/sw/sw.ts`, `swCore.ts`, `serviceWorker.ts`: click handler = ack via MessageChannel → `client.navigate` → `openWindow`; absolute own-origin URLs normalised, trailing slashes dropped; `CACHE_VERSION` v2.
- Tests: `spaShell.test.ts`, `pwaNotificationClick.test.ts`, extended `pwaServiceWorker.test.ts`; `e2e/pwa.e2e.ts` uses `CACHE_NAMES`.

## Verification
bun test 908 pass (1 pre-existing giveaway failure); tsc 0 errors; real Chromium against the assembled output: styled app, URL kept, one title/canonical/JSON-LD, no-JS content intact, unknown slug → 404 + in-app not-found.

## Not verified
Real iOS/Android devices, installed-PWA cold start, real push delivery, deployed Vercel URL.
