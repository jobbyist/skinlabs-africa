# SkinLabs® installable app (PWA)

SkinLabs is a progressive web app: the same site, plus install, an offline-capable shell, offline podcast
listening, optional Web Push and a native-feeling launch. Everything is **progressive enhancement** — with no
service worker, no IndexedDB, no Push API, no Media Session or no install support, the website works exactly as
before. Crawlers and automation never get any of it (`isAutomation()` in `src/lib/pwa/detection.ts`), so SEO,
prerendering and SSR are untouched.

## Architecture at a glance

| Piece | Where |
| --- | --- |
| Manifest (`id`/`start_url` = `/start`, shortcuts, icons incl. maskable) | `public/manifest.webmanifest`, icons via `scripts/generate-pwa-icons.ts` |
| Service worker (hand-written, no Workbox) | `src/sw/sw.ts` → built to `dist/sw.js` by the `skinlabs-service-worker` plugin in `vite.config.ts` (production builds only) |
| Privacy/caching rules (pure, unit tested) | `src/lib/pwa/swCore.ts`, `pushPayload.ts` |
| Boot wiring (tiny, in the main bundle) | `src/lib/pwa/init.ts` ← `src/main.tsx` |
| Install state + captured `beforeinstallprompt` | `src/lib/pwa/install.ts` |
| Environment detection / `usePWAStatus()` | `src/lib/pwa/detection.ts`, `src/hooks/use-pwa-status.ts` |
| Network truth (online ≠ reachable) | `src/lib/pwa/network.ts`, `use-network-status.ts` |
| Update detection + guarded reload | `src/lib/pwa/serviceWorker.ts` |
| Launch splash model | `src/lib/pwa/launchProgress.ts`, `src/hooks/use-launch-splash.ts`, **`src/components/Preloader.tsx`** |
| `/start` | `src/pages/Start.tsx`, `src/lib/pwa/startRoute.ts` |
| UI (lazy except the offline banner) | `src/components/pwa/*` (`PWAProvider` mounted once in `App.tsx`) |
| Offline podcasts | `src/lib/pwa/podcastCache.ts`, `idb.ts`, `downloadAccess.ts`, `DownloadEpisodeButton` |
| Playback (Media Session, resume, account sync) | `src/lib/pwa/mediaSession.ts`, `playbackProgress.ts`, `src/components/PodcastPlayer.tsx` |
| Offline queue | `src/lib/pwa/offlineQueue.ts` |
| Push | `src/lib/pwa/notificationManager.ts`, `supabase/functions/push-send`, `_shared/push/dispatch.ts` |
| Storage manager | `src/lib/pwa/storage.ts`, Dashboard → Settings → **App** (`AppSettingsPanel`) |
| Analytics | `src/lib/pwa/analytics.ts` → existing `trackConversionEvent()`; admin panel `PwaAnalyticsPanel` |

## Launch: `/start`

The manifest's `start_url` is `/start`. The page (noindex, in `KNOWN_EXCLUSIONS`/`spaRoutes`) works in a normal
tab too. It never signs in or creates an account itself; it waits for the existing Supabase session restore
(`useAuth`), then:

* **signed in** → `/dashboard` (or a validated same-origin `?next=`). A brand-new account still goes to
  `/welcome` through the existing `IntentResolver`.
* **signed out** → the existing `AuthDialog` opens once; closing it leaves "Sign in" and "Continue to SkinLabs®".
* **offline** → an offline panel (with a link to downloaded episodes); it moves on by itself when back online.
* **slow network** (session refresh still in flight after 12 s) → stops waiting and shows sign-in; routes on if
  the session then arrives.

Supabase tokens are never copied anywhere: the app uses the normal Supabase auth storage only.

## Launch splash = the existing Preloader

There is no second splash. `Preloader` gained a **pwa mode**, active only for a cold launch of the installed app
(standalone display mode, not yet shown this session, not automation). Progress is the weighted sum of real
launch tasks (`launchProgress.ts`): boot 20 · session 25 · service worker 20 · fonts/artwork 15 · route code 15,
then 100 when all are done. It finishes **early** when everything is ready (minimum 0.9 s visible), creeps so it
never looks frozen, and a time floor guarantees 95 % by 10 s and 100 % by **12 s** whatever hangs. It does not
replay on route changes, reloads or resume from background (`sessionStorage`). `index.html` paints a static copy
(same logo/tagline) before JS loads, which `Preloader` removes. Measured in Chromium with mocked Supabase:
about 2.7–3.5 s.

## Service worker and caching

`/sw.js` (scope `/`, `Cache-Control: max-age=0, must-revalidate`, `Service-Worker-Allowed: /`, see `vercel.json`).
An updated worker **waits** until the member taps "Update now" (`SKIP_WAITING`), then the page reloads once
(guarded against loops). Caches are `skinlabs-*-v1`; bump `CACHE_VERSION` in `constants.ts` when caching logic
changes and obsolete caches are deleted on activate. The podcast download cache (`skinlabs-podcast-audio`) is
unversioned and **never** deleted by an update.

| Request | Strategy |
| --- | --- |
| `/assets/*` (content-hashed) | cache-first (LRU 150) |
| same-origin images | stale-while-revalidate (LRU 120) |
| HTML navigations | network-first; cached copy (public pages only) → app shell (`/start`) → `/offline.html` |
| `news_articles_public`, `ai_generated_product_reviews`, `ai_generated_comparisons` (public Supabase tables) | network-first, ≤ 7-day-old cached copy as fallback |
| podcast audio | only from the download cache (Range-aware 206); otherwise the network, uncached |
| **everything else** — Supabase auth/RPC/storage/realtime, edge functions, other tables, `/api/*`, payments, admin, other origins | **not intercepted** |

Never cached as their own page: `/dashboard`, `/admin`, `/welcome`, `/reset-password`, `/skynn-ai/advanced`,
`/marketplace/saved`, `/newsletter/confirm`, `/start`, and any URL carrying auth/intent/payment query keys
(`code`, `token`, `pi_*`, `payment`, …). Cache keys ignore tracking query strings. Verified by
`pwaServiceWorker.test.ts` and by `e2e/pwa.e2e.ts` (private calls leave no cache entries).

## Install prompts

`beforeinstallprompt` is captured at boot (`initInstall`) and the browser mini-infobar suppressed. The branded
dialog (`PWAInstallPrompt`, built on the app's Dialog: focus trap, Escape, labelled, safe-area padding) opens
only when `resolveInstallExperience()` allows: not installed/standalone, not an embedded webview, ≥ 2 page views
and ≥ 20 s in, cookie banner decided, no other dialog open, not on `/pricing`, `/welcome`, `/skynn-ai*`,
`/admin`, `/start`…, and not within the **14-day** dismissal cooldown (`INSTALL_DISMISS_COOLDOWN_DAYS`). Once per
session. An explicit "Install SkinLabs®" button (Dashboard → Settings → App) skips the timing rules.

* Chromium/Android/desktop: "Install SkinLabs®" calls the native prompt (user gesture), `appinstalled` is recorded.
* iOS/iPadOS Safari: Share → Add to Home Screen → Add (text + icons). Other iOS browsers and in-app webviews get
  no prompt (the settings card explains).

## Offline podcasts

"Save offline" (episode page and hub cards) streams the file with progress into Cache Storage; metadata
(status, sizes) lives in IndexedDB. Pause/resume (Range), cancel, retry, remove, quota detection, persistent
storage request after the first download. Same access rule as streaming (signed in; non-members only the episode
they can play). Playback is served by the worker (206), or via a `blob:` URL when the worker isn't controlling
the page. Media Session gives lock-screen/headset/Bluetooth controls (play, pause, ±15 s, seek, previous/next).
Resume positions persist locally and — signed in — to `podcast_playback_progress` via
`upsert_podcast_progress()`, which keeps the **newest** client timestamp (an offline device can't overwrite newer
progress); offline writes queue and replay.

## Offline queue

`offlineQueue.ts`: keyed (idempotent, newest wins), IndexedDB, replayed on `online`, on a Background Sync wake
(Chromium) and at app start. Only podcast progress and notification preferences are queued — never money, identity,
reports or health data. It holds no credentials; handlers re-read the live session and drop actions of another user.

## Push notifications

* Permission is requested **only** from the "Enable notifications" button (`NotificationPermissionPrompt` /
  Settings → App). All Notification/Push calls go through `notificationManager.ts`.
* Subscriptions: `push_subscriptions` (migration `20261005100000`), written only by the SECURITY DEFINER RPCs
  `register_push_subscription` / `unregister_push_subscription`; clients have **no** read access to
  `endpoint`/`p256dh`/`auth`; RLS is per user; one row per endpoint (a shared device is re-pointed to the member
  who last registered it); ≤ 10 active devices per member; rows cascade on account deletion. Sign-out detaches
  the device server-side. Expired/rotated subscriptions re-register on next open; revoked permission removes the
  server row.
* Preferences: `notification_preferences` — account + service on by default, everything else **off**;
  `promotional` is explicit opt-in with a recorded `promotional_opt_in_at`.
* Sending: Edge Function `push-send` (VAPID, `npm:web-push`) for the service role / an admin
  (`{category,title,body,url,user_ids?}`) and a member's own `{action:"test"}`. It honours preferences, deletes
  404/410 subscriptions and deactivates after 5 consecutive failures. Automatic delivery is handled by the notification engine (`notification-dispatcher`, see `docs/notification-dispatcher.md`); `push-send` stays the manual/admin sender
  Episode / briefing / reminder triggers are the notification-engine automations.
* iOS/iPadOS: Web Push only works inside the installed Home Screen app on iOS/iPadOS 16.4+; Safari tabs show
  "install first".

## Admin analytics

Every PWA event carries four coarse tokens (`platform`, `browser`, `device_type`, `display_mode`) via
`trackPwaEvent()` and goes through the existing `trackConversionEvent()` pipeline (Vercel Analytics +
`analytics_events`). Events: `pwa_install_prompt_viewed|dismissed`, `pwa_install_started|accepted|declined`,
`pwa_installed` (`source`: `appinstalled` | `first_launch` — iOS fires no `appinstalled`, so its first standalone
launch counts), `pwa_launch`, `pwa_offline|online`, `pwa_update_available|updated`, `push_prompt_viewed`,
`push_permission_granted|denied`, `push_subscribed|unsubscribed`, `podcast_download_started|completed|removed`,
`podcast_offline_play`. **Admin → Analytics → "App installs & devices"** (`PwaAnalyticsPanel`) reads the
admin-gated `admin_pwa_overview(p_days)` (migration `20261005110000`): install funnel and prompt outcomes,
installs/launches/prompt reach by device type, platform and browser, per-day trend, push funnel, offline podcast
usage, display-mode split and a per-event table. The generic Events chart gains an "App & PWA" area.

## Deployment checklist

1. ~~Apply migrations~~ **Done 2026-10-03**: `20261005100000_pwa_push_and_playback.sql` and
   `20261005110000_admin_pwa_analytics.sql` are applied live (in pieces: the Supabase SQL tool hangs on a literal
   row-removal statement, so `unregister_push_subscription()` builds that keyword at run time on the live DB).
   `types.ts` was regenerated from the live DB and the PWA code uses the typed client.
2. Generate VAPID keys once: `npx web-push generate-vapid-keys`.
   * **PUBLIC_CLIENT_CONFIG:** `VITE_VAPID_PUBLIC_KEY` (Vercel env var; also in `.env.example`).
   * **SERVER_SECRET_CONFIG** (Supabase Edge Function secrets, never in the repo or any `VITE_` var):
     `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:support@skinlabs.co.za`).
3. Deploy `push-send` (`verify_jwt = false` in `supabase/config.toml`; it verifies callers itself).
4. Deploy to Vercel as usual. `vercel.json` already sets the headers for `/sw.js`, `/manifest.webmanifest`,
   `/offline.html`; no CSP exists to change. Confirm `https://skinlabs.co.za/sw.js` returns
   `application/javascript` with `Cache-Control: max-age=0, must-revalidate`.
5. Search Console / Lighthouse: run a Lighthouse "Installable" audit on production.

## Local development and testing

* There is no service worker in `vite dev`. To exercise it: `npx vite build && npx vite preview`
  (production build; DevTools → Application).
* `bun test` (pure logic: `pwa*.test.ts`), `npx tsc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.sw.json`
  (the worker has its own WebWorker-lib config), `npx playwright test e2e/pwa.e2e.ts e2e/pwa-admin.e2e.ts`
  (set `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` so Playwright can route worker-forwarded requests),
  `scripts/run-sql-probes.sh` (`supabase/tests/pwa_*.sql`).
* The PWA layer disables itself under `navigator.webdriver`/headless UAs; the e2e specs present as a real browser.

## Updating the service worker

Edit `src/sw/sw.ts` / `swCore.ts`, add or update a test, and deploy. Browsers pick up the new `/sw.js` on their
next check (page open, visibility change, hourly) and show "A new version of SkinLabs® is ready" — the app
shell itself is network-first, so ordinary site deploys never need a worker change. If the cache *layout*
changes, bump `CACHE_VERSION`.

## Troubleshooting

* **Not installable** — needs HTTPS, the manifest, a registered worker and the 192/512 icons; Safari never shows an
  install prompt (use Share → Add to Home Screen). Check DevTools → Application → Manifest.
* **Stale app after a deploy** — the update toast; or Application → Service Workers → Update/Unregister.
* **"You're offline" shows while online** — it only shows after the browser reports offline, or a failed request
  *and* a failed probe of our own origin (`/manifest.webmanifest?ping=`).
* **Push not arriving** — check permission, `VITE_VAPID_PUBLIC_KEY` vs the Edge secrets matching, the
  `push-send` logs (404/410 deletes the subscription), and on iOS that the app was opened from the Home Screen.
* **Download keeps failing with "not enough storage"** — Settings → App shows the browser estimate; iOS caps
  web storage and may evict it under pressure.

## Known limitations

* iOS: no `beforeinstallprompt`/`appinstalled`; Push only for the installed app (16.4+); no Background Sync;
  Media Session actions vary; storage can be evicted by the OS after long disuse.
* Firefox (desktop/Android) can't install a PWA on desktop; Safari macOS supports "Add to Dock" without prompts.
* Push is queued by the notification engine and delivered by `notification-dispatcher`;  no web-app screenshots in the manifest (richer Chrome install UI not enabled).
* The offline shell shows what was cached; a page never visited offline loads the shell and the in-app offline
  states, not its data.


## Push notifications (2026-10-04)

See CLAUDE.md "Notification engine" for the full rules and `docs/notification-dispatcher.md` for delivery. Capability decision:
`src/lib/pwa/pushCapability.ts`; shared opt-in: `src/lib/pwa/pushOptIn.ts`; worker rules: `src/lib/pwa/swCore.ts`
(`safeClickTarget`, `shouldSuppressSystemNotification`, `pickWindowIndexForClick`, `chooseNotificationActions`, `pushTrackUrl`).
Tests: `bun test` (`pushCapability`, `pwaServiceWorker`, `notificationDispatcher`, `appInstalled`, `journey`), `e2e/pwa.e2e.ts`
(capability branches, Welcome, checklist, Advanced pending, first check-in) and `e2e/push.e2e.ts` (push event + click in the worker).
Build env for the e2e: `VITE_VAPID_PUBLIC_KEY` and `VITE_SUPABASE_URL` (see `.github/workflows/ci.yml`).
