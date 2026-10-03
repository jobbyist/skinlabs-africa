# TikTok Pixel + Events API

Pixel code `DB0DGNBC77U1FE0MB8Q0` (public; override with `VITE_TIKTOK_PIXEL_ID`).

## Why it is not pasted into `index.html`

The cookie banner and Cookie Policy promise advertising technologies run only when the
visitor turns on **Advertising / Targeting** (`targetedAdvertising`). TikTok's snippet is
therefore injected from `src/lib/tiktok/pixel.ts`, only once that consent exists:

- no consent → nothing loads, no request to TikTok;
- consent given → pixel loads, `ttq.page()` fires, later SPA navigations add page views
  (`<TikTokPixel />`, mounted in `App.tsx` and `SsrConversionShell`);
- consent withdrawn → `revokeConsent()` + `disableCookie()`, all sending stops;
- crawlers / headless renderers never load it (`isAutomatedAgent`).

`index.html` must not contain the snippet (a test enforces it).

## What is sent

`trackConversionEvent()` forwards a few events (`src/lib/tiktok/events.ts`):
`pricing_view` → ViewContent, `marketplace_add_to_cart` → AddToCart, `signup_completed` →
CompleteRegistration, `trial_started` → StartTrial, `checkout_started` / `keep_membership_viewed`
→ InitiateCheckout, `checkout_completed` / `credit_pack_purchased` → CompletePayment,
`subscription_started` / `keep_membership_completed` → Subscribe, `newsletter_confirmed` /
`partner_enquiry_submitted` / `brand_request_submitted` → SubmitForm.
Never sent: skin-analysis steps, answers, photos/MST, admin events, anything else.

Each forwarded event is reported twice with the **same `event_id`** (browser pixel + the
`tiktok-events` edge function), so TikTok de-duplicates. The server copy carries `ttclid`
(from the landing URL), `_ttp`, IP, user agent, the page URL without its query string, and — for
a signed-in member only — SHA-256 hashed email and account id taken from the verified JWT (never
from the request body). The function refuses requests without `consent: true` and any event
outside the whitelist.

## Page events, identify, extra events (2026-10-03, follow-up)

- **ViewContent** fires on key event pages only (`contentForPath()` in `src/lib/tiktok/events.ts`): home, `/skynn-ai`,
  `/skynn-ai/advanced`, `/pricing`, `/routines`, review / ingredient / briefing / episode pages and their hubs. Payload is
  `contents: [{content_id, content_type, content_name}]` from the public path/slug; dashboard, admin, welcome, auth and legal
  pages are never reported.
- **identify** (`identifyTikTokUser()`) runs before events for a signed-in member with advertising consent: SHA-256 of email and
  account id, hashed in the browser. Phone numbers are not sent.
- Added: AddPaymentInfo (payment method chosen), Purchase (`checkout_completed`, `credit_pack_purchased`), Search.
  **Search sends the event only, never the words typed** (health-adjacent queries). `value`/`currency` are included only when a
  call site supplies them; nothing is invented.
- Not wired (no honest trigger exists): AddToWishlist, PlaceAnOrder.

## Admin → Ads tab

`TikTokAdsPanel` reads `admin_tiktok_events_overview()` (admin-gated) over `public.tiktok_event_log`, which the `tiktok-events`
function fills (event, page, status; no personal data; migration `20261004120000_tiktok_event_log.sql`, applied live 2026-10-03). It shows homepage vs SKYNN AI events, per-day volume, delivery status and the latest events.
It is OUR delivery log, not TikTok's attribution or spend. Events that arrive before the access token is set are logged as
"Awaiting token" and the tab says so.

### Campaigns report (UTM attribution, 2026-10-04)

The same tab opens with a **Campaigns** table (`CampaignAttribution`, `admin_campaign_attribution(p_days)`, migration
`20261004130000_campaign_attribution.sql`). It is the FIRST-PARTY count: it reads `analytics_events` (not consent-gated), so it
shows every campaign visitor, while TikTok only sees visitors who accepted advertising cookies. Expect TikTok's numbers to be lower.

- Tag ad links: `https://skinlabs.co.za/skynn-ai?utm_source=tiktok&utm_medium=paid_social&utm_campaign=<campaign>&utm_content=<ad>`.
  Lowercase letters, digits and `_ - . ~` only. A bare `ttclid` (no UTMs) is credited as `tiktok / paid_social / ttclid_only`.
- `src/lib/attribution.ts` keeps the labels in `sessionStorage` with a random per-session id (`attr_sid`), logs one
  `campaign_landing` per campaign per session, and merges the labels into every `trackConversionEvent` payload that goes to
  Vercel Analytics and `analytics_events`. **They are never forwarded to TikTok** (the Events API function strips queries by design).
- Stages (distinct sessions): landings → analysis started → analysis completed → sign-ups (`signup_completed`) → trials.
- `CompleteRegistration` also fires for Google sign-ups (`IntentResolver`, once per new account via `oauthRegistration.ts`);
  email sign-ups fire it at form submit, as before.
- Probe: `supabase/tests/campaign_attribution.sql` (rolled back).

## Where the access token goes

Supabase dashboard → project `gnkpzijxuciiaamakgzm` → Edge Functions → Secrets → add `TIKTOK_EVENTS_ACCESS_TOKEN`
(or `supabase secrets set TIKTOK_EVENTS_ACCESS_TOKEN=<token>`). Never in `.env`, Vercel or the repo (it must not reach the browser).
Generate it in TikTok Events Manager → your web pixel → Settings → Events API → Generate access token.

## Human steps still needed

1. Events Manager → your pixel → **Settings → Generate Access Token** (Events API), then
   `supabase secrets set TIKTOK_EVENTS_ACCESS_TOKEN=<token>` (project `gnkpzijxuciiaamakgzm`).
   Until it is set the function answers 503 and only the browser pixel works.
2. Deploy `tiktok-events` (it imports `../_shared/tiktok/` and `../_shared/payments/authedUser.ts`).
3. Test: set `TIKTOK_TEST_EVENT_CODE` (from Events Manager → Test events), accept advertising
   cookies on the site, trigger a sign-up/trial, confirm browser + server events appear and are
   marked de-duplicated; then remove the test code secret.
4. Review Privacy Policy text for TikTok as a processor/recipient (Cookie Policy was updated;
   the Privacy Policy still needs a human/legal read).

Not done on purpose: server-side PageView (volume, little value), server-side purchase events from
the PayFast/PayPal webhooks (no consent signal exists there — would need consent stored with the
checkout intent first).
