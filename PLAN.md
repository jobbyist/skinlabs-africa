# PLAN — Free-first SKYNN AI Formulator, monthly free analysis, "Today's skin weather"

Branch: `feat/free-first-formulator-weather` (local only, nothing pushed/deployed).
Status: **approved as recommended (2026-09-24) and built** — see "Build status" at the end.

---

## 0. Stack map (what's actually here)

| Concern | Reality in this repo |
|---|---|
| Framework / router | **Vite + React SPA**, `react-router-dom` (`src/App.tsx`). A handful of SEO routes are also SSR'd via TanStack Start/Nitro (`src/routes/*`), but the dashboard and formulator are SPA-only. **Not Next.js** — there are no server actions, server components or Vercel data cache/`revalidate`. |
| Server layer | **Supabase**: `SECURITY DEFINER` Postgres RPCs + Deno Edge Functions (`supabase/functions/*`). Three small Vercel functions exist in `api/` (auth/analytics only). |
| Auth | Supabase Auth (`src/hooks/use-auth.ts`), single surface `AuthDialog.tsx`. |
| DB / ORM | Supabase Postgres, no ORM — `supabase-js` + generated types in `src/integrations/supabase/types.ts`. Migrations in `supabase/migrations/`. Live project `gnkpzijxuciiaamakgzm`. |
| Tier storage | `profiles.subscription_status` / `trial_plan` / `trial_ends_at` → `useMembership()` (`resolveTier`) → `explorer \| glow_lite \| insider \| vip`. Capabilities in `src/lib/entitlements.ts`; server-side `is_member()` = Insider/VIP. Prices are DB-driven (`pricing_plans`). |
| AI Formulator | Route **`/skynn-ai`** (`/ai-formulator` redirects). Page `src/pages/AIFormulator.tsx`; all logic in `src/components/AIFormulator.tsx` (1.5k lines) + `src/components/ai-formulator/*`; the starter engine is **pure client-side TS** in `src/lib/starter-analysis/*` (already well unit-tested). Insider/VIP go to the live `skincare-ai` edge function instead. |
| Current metering | `claim_starter_analysis()` RPC — a **lifetime** counter (`profiles.starter_analyses_used` vs `pricing_settings.free_ai_analysis_allowance`, default 1), then falls back to spending a purchased credit/Analysis Pass. |
| Result saving | Client **upserts directly** into `skincare_recommendations` (RLS owner-insert) via `persistStarterResultToAccount()`, idempotent on `(user_id, client_analysis_id)`. |
| Analytics | `trackConversionEvent()` in `src/lib/analytics-events.ts` → Vercel Web Analytics. Typed event union — I'll add the 5 new names there, no new wrapper needed. |
| Design tokens | HSL CSS vars in `src/index.css` (`:root` + `.dark`) mapped in `tailwind.config.ts`. Inter (`--font-sans`) and Montserrat (`--font-heading`, `.font-heading`) already wired. Light/dark via `next-themes`. |
| Dashboard | **Exists**: `/dashboard` → `src/pages/UserDashboard.tsx`, "Home" tab (`overview`) is where signed-in users land. `profiles.city` already exists (free-text input in `ProfileTab.tsx`). Consult is nav-only ("Coming Soon") — no dashboard card today; I won't add one. |

---

## ⚠️ Things in the brief that don't match the codebase (please read)

1. **Anonymous visitors are *not* gated today.** There's no "Sign up to get started" gate in the code (grepped). Anonymous visitors already complete the whole quiz and get the **full** starter analysis (AM/PM routine, grounded product picks, PDF download), it's held in `localStorage` through sign-up, and it gets attached to the account automatically when one exists (`AIFormulator.tsx` ~L500–590). The "sign up to get started" gate you've seen could be an old deploy, a cached page or a different surface. Worth checking what you saw.
   → So the brief's Feature 1 actually means **taking something away from anonymous users** (full result → summary only). That can lift sign-ups, but it cuts against the standing "free acquisition / value before the ask" principle in `CLAUDE.md`, and the free PDF would go too. **Decision needed (Q1).**
2. **Price in the upgrade CTA.** Your brief says Insider is R79/mo and the CTA copy says "R99/mo". Live `pricing_plans` shows **Insider = R79** (Lite R39, VIP R199 and not purchasable). I'll read the price from the DB (`pricing_plans`) rather than hardcode either number, so the CTA can't drift.
3. **"Enforce on the server" has a hole today.** The starter engine runs in the browser, and the result row is written by a direct client upsert. The `claim_starter_analysis` call is only advisory: a tampered client can skip it and still upsert a row. The real enforcement point has to be **the save**. Plan: move the save into an RPC that checks and stamps the limit atomically, and remove the direct client INSERT on starter rows (§1.2).
4. **Colour tokens clash with the existing shadcn names.** The live theme already uses `--primary` = `#262626` (near-black buttons) and `--accent` = light grey. Redefining `--primary` as `#9CA3AF` would turn every primary button on the site grey, and it fails contrast. So I'll **add brand-namespaced tokens** next to the existing ones instead of renaming them (§4). The existing `--muted-foreground` (`#737373`, 4.7:1 on white) already passes AA. I'll still add the `#5E5E5E` secondary-text token you asked for.
5. **Weather licence: Open-Meteo's free API is not allowed here.** Their terms state *"You may only use the free API services for non-commercial purposes"* and list *"websites … that display advertisements"* as commercial. SkinLabs runs AdSense, so it's commercial use. Options in Q5.
6. **"Vercel data cache / revalidate"** doesn't exist in a Vite SPA. The equivalent is a Supabase Edge Function plus a small Postgres cache table (§3.2), which fits how every other server job in this repo already works.

---

## 1. Feature 1 — Free-first formulator + rolling 30-day free analysis

### 1.1 Limit config — `src/lib/formulator/limits.ts` (new)
```ts
export const FORMULATOR_LIMITS = {
  explorer:  { freeAnalyses: 1, windowDays: 30 },   // rolling, from last completed analysis
  glow_lite: { freeAnalyses: 1, windowDays: 30 },   // ← Q2: same as Explorer? 
  insider:   { unlimited: true },
  vip:       { unlimited: true },
} as const;
export function computeFormulatorAllowance(tier, lastAnalysisAt, now, limits = FORMULATOR_LIMITS)
  → { unlimited, remaining: 0|1, lastAnalysisAt, nextUnlockAt, locked }
```
A pure function used by the UI and the unit tests. The **server copy lives in SQL** (§1.2) and reads the same numbers from `pricing_settings`. That's the repo's DB-driven pricing convention, so you can change limits without a deploy. The TS object mirrors the seeded values; a test pins the two together by parsing the migration's seed. (If you'd rather have the TS object be the *only* source, the SQL function would hardcode the numbers instead, which is simpler but needs a migration to change them.)

**Rolling 30 days vs calendar month:** rolling is no harder here. It's one `timestamptz` column and `last + interval '30 days'`. Going with rolling, as specified.

### 1.2 Schema / migration — `supabase/migrations/2026092xxxxxxx_formulator_rolling_allowance.sql`
- `profiles.last_starter_analysis_at timestamptz` (protected by the existing `app.privileged_write` trigger like `starter_analyses_used`), **backfilled** from each user's most recent `skincare_recommendations.created_at`.
- `pricing_settings.free_analysis_window_days int NOT NULL DEFAULT 30` (reuses existing `free_ai_analysis_allowance` = 1).
- New RPC **`get_formulator_allowance()`** returns `unlimited, remaining, last_analysis_at, next_unlock_at, pass_balance`. It feeds the dashboard card and the locked state.
- New RPC **`save_starter_analysis(p_payload jsonb, p_variant_key text)`** is the only write path for starter results. In one transaction it:
  1. returns the existing row if this `client_analysis_id` was already saved (so refinements and retries are never charged twice);
  2. Insider/VIP (`is_member()`) → allow;
  3. Explorer/Lite → allow if `last_starter_analysis_at IS NULL OR now() >= last + window`;
  4. else (**Q3**) spend a purchased credit/Analysis Pass if they hold one, or else `RAISE` with error code `P0001 'formulator_limit_reached'` plus `next_unlock_at`;
  5. insert the row and stamp `last_starter_analysis_at = now()`.
- `claim_starter_analysis()` is kept as a **read-only pre-check** that calls the same logic without stamping. The UI can then say "locked" before the quiz, but the save is still what enforces the limit.
- Drop the direct `INSERT` RLS path for starter rows on `skincare_recommendations`. I'll check first that the edge function (service role) and Advanced flows don't depend on it.
- Standard follow-ups: `REVOKE … FROM PUBLIC, anon`, `GRANT EXECUTE … TO authenticated`, run the Supabase advisors, regenerate or hand-extend types.

**Grandfathering:** existing free users who used their lifetime 1 analysis more than 30 days ago get a new free one straight away. That's the intended new behaviour; just confirming you're happy with it.

### 1.3 Anonymous → account handoff
- Keep the existing `localStorage` snapshot (`starter-analysis/persistence.ts`). It already survives refreshes, Google OAuth redirects and email-confirm links opened in the same browser, and it holds no PII beyond the answers. A signed cookie would need a new Vercel function and signing secret for no gain in a SPA. **Limitation:** confirming on a *different device* loses the result. That's acceptable in my view; say if not.
- When the user is signed in, `AIFormulator` calls `save_starter_analysis` instead of the direct upsert. This first save is always allowed because a new account has no prior analysis.
- **If Q1 = summary-only for anonymous users:** the results step shows skin type + top 2 concerns (`primaryConcern` + first `secondaryConcerns`), a "Save your results — free" sign-up, and blurred/locked routine sections. The PDF download moves to after sign-up. The full result is already computed locally, so it's revealed instantly after sign-up with no re-quiz.

### 1.4 Locked state (Explorer/Lite, inside the window)
Checked before the quiz starts and handled again if the save is rejected:
"Your next free analysis is available on {date}" · a disabled **Re-analyse** `<button aria-disabled="true">` with `aria-describedby` pointing at the date text (so screen readers announce why) · an "Unlimited re-analysis with Glow Insider · R{price}/mo" link to `/pricing`. The existing Analysis Pass option stays if Q3 = yes.

### 1.5 Analytics (added to the `ConversionEvent` union)
`formulator_started` (quiz start, all users) · `formulator_completed_anonymous` · `signup_from_formulator` (sign-up completed from the results CTA) · `reanalysis_blocked` (pre-check or server rejection) · `upgrade_clicked_from_formulator`. The existing events stay, so current funnels don't break.

### 1.6 Tests (`bun test`)
- `src/lib/formulator/__tests__/limits.test.ts`: every tier; never analysed; day 29 23:59 vs day 30 00:00 boundary (UTC/SAST safe); unlimited tiers; `nextUnlockAt` maths.
- Handoff test: the completed snapshot round-trips, and the pure `buildStarterSavePayload()` produces the RPC payload used after sign-up.
- Server rejection: a SQL test script (`supabase/tests/formulator_allowance.sql`) that impersonates a user via `set_config('request.jwt.claims', …)` inside `BEGIN … ROLLBACK`, runs the RPC twice and asserts the second call raises `formulator_limit_reached`, then checks that an Insider can save twice. I'll **run it against the live project inside a rolled-back transaction** (nothing persists). There's no local Postgres test harness in this repo. Flag if you'd rather I use a Supabase branch.

## 2. Feature 2 — Formulator as the dashboard hero
In `UserDashboard.tsx` → Home tab, the top row becomes a `lg:grid-cols-3` grid:
- **`SkinProfileHero.tsx`** (new, `lg:col-span-2`): skin type as the headline (Montserrat), concern chips, one-line guidance (from the saved `result_payload`, no new copy engine), **View full analysis** (primary → `?tab=analysis`), **Re-analyse** (secondary → `/skynn-ai`, locked per §1.4). With no analysis yet, it shows a "Start your free skin analysis" CTA.
- **`AnalysisCreditsCard.tsx`** (new, `lg:col-span-1`): free analyses left (0/1), `<Progress>`, last analysis date, next unlock date, upgrade link. Paid users see "Unlimited".
- The existing 4-up stat row moves below the hero and loses its "Analyses" count, since the credits card covers it. `AnalysisPassesCard` stays because passes are a separate product. No Consult card.

## 3. Feature 3 — "Today's skin weather"

### 3.1 Pure logic (unit-tested) — `src/lib/skinWeather/`
- `types.ts`: `SkinWeather { city, uvNow, uvMax, uvPeakAt, humidity, tempMax, fetchedAt }`.
- `cities.ts`: the 10 SA cities with **city-centre** coordinates, plus `nearestCity(lat, lon)`.
- `tips.ts`: `getSkinWeatherTip(weather, skinProfile?)` uses the WHO UV bands (0–2 Low … 11+ Extreme), "reapply SPF around {peak}" at 3 and above, humidity <30% (layer hydration and seal) / >70% (lighter textures), and profile-aware wording (e.g. dry or dehydrated skin plus dry air). Cosmetic-guidance wording only, and a test asserts none of the `FORBIDDEN_DIAGNOSIS_TERMS` / treat/cure/prevent-disease phrasing appears.
- `__tests__/tips.test.ts` covers every band edge (2/3, 5/6, 7/8, 10/11), both humidity edges and the profile variants.

### 3.2 Server fetch + cache
- Edge Function **`supabase/functions/skin-weather/`** is called with `?city=<key>` only; the browser never calls the weather provider. It holds a provider adapter `getSkinWeather(lat, lon)` in `_shared/weather/` (a swappable interface; one implementation per Q5).
- Cache table **`skin_weather_cache (city_key pk, payload jsonb, fetched_at)`**, RLS on, service-role only. TTL is 45 min, so at most about 10 cities × 32 = ~320 upstream calls a day in the worst case. The response also sends `Cache-Control: public, max-age=600`.
- `verify_jwt = false` and a public read, since the data isn't personal. City keys go through an allow-list.

### 3.3 Location (POPIA)
Order: (1) `profiles.city`, matched against the 10 keys. The existing free-text field becomes a **Select** of the 10 cities in `ProfileTab` plus a picker on the card; existing free-text values that don't match are left alone but ignored. (2) A "Use my location" button → browser geolocation → **snapped client-side to the nearest of the 10 cities** → only the city key is sent to the server, and I'll offer to save it to the profile. Raw coordinates are never sent or stored. (3) Default: Johannesburg, with a "no location set" hint.

### 3.4 UI — `SkinWeatherCard.tsx`
Dark card on the Accent ink token, a large UV number in the highlight token with its band label, "peaks ~13:00", two stat tiles (humidity, today's high), a city label with a change-city control, a one-line tip, and provider attribution. States: skeleton, error ("Weather's unavailable right now", isolated in its own query and error boundary), no-location. React Query `staleTime` 30 min. It stacks full width on mobile and sits in the dashboard's second row on desktop.

## 4. Design tokens (additive, `src/index.css` + `tailwind.config.ts`)
```
--brand-slate:  #9CA3AF  (borders/decoration only)   → brand-slate
--brand-cream:  #F8EDCB                               → brand-cream
--brand-ink:    #262626  (weather card surface)      → brand-ink
--brand-canvas: #FCFCFC  (= existing --background)
--brand-gold:   #F9D69C  (link/highlight, UV number) → brand-gold
--text-secondary: #5E5E5E (dark-mode counterpart ~#B5B5B5) → text-secondary
```
Stored as HSL like the rest. The existing shadcn `--primary`/`--accent`/`--secondary` are **not** renamed (see ⚠️4). Dark-mode values are defined for every token. No hex values in components. Touch targets ≥44px (`min-h-11`), real `<button>`/`<a>` elements, and labelled icon-only buttons.

## 5. Files

**New:** `src/lib/formulator/limits.ts` (+tests) · `src/hooks/use-formulator-allowance.ts` · `src/components/dashboard/SkinProfileHero.tsx` · `src/components/dashboard/AnalysisCreditsCard.tsx` · `src/components/ai-formulator/ReanalysisLockedPanel.tsx` · `src/components/ai-formulator/AnonymousResultSummary.tsx` (if Q1 = yes) · `src/lib/skinWeather/{types,cities,tips}.ts` (+tests) · `src/hooks/use-skin-weather.ts` · `src/components/dashboard/SkinWeatherCard.tsx` · `supabase/functions/skin-weather/index.ts` · `supabase/functions/_shared/weather/{provider,<impl>}.ts` · 2 migrations (allowance, weather cache) · `supabase/tests/formulator_allowance.sql`.

**Modified:** `src/components/AIFormulator.tsx` · `src/lib/starter-analysis/persistence.ts` · `src/pages/UserDashboard.tsx` · `src/components/dashboard/ProfileTab.tsx` (city select) · `src/lib/analytics-events.ts` · `src/index.css` · `tailwind.config.ts` · `src/integrations/supabase/types.ts` · `supabase/config.toml` (skin-weather `verify_jwt=false`) · `CLAUDE.md` (dated project-memory entry).

## 6. New env vars / secrets
- **Weather API key** as a **Supabase Edge Function secret** (e.g. `OPENWEATHER_API_KEY` or `OPEN_METEO_API_KEY`, depending on Q5). Nothing in this environment can set Supabase secrets, so you'll need to run `supabase secrets set …` yourself (same known gap as the other pipeline secrets). No Vercel env vars.

## 7. Open questions (need answers before I build)
- **Q1: Anonymous results.** (a) Summary only (skin type + top 2 concerns), full routine and PDF after free sign-up, as the brief says; or (b) keep today's full anonymous result and just strengthen the "Save your results — free" CTA. I lean slightly to **(a) with the PDF kept free**, but it's your call on the growth-vs-principle trade-off.
- **Q2: Glow Lite (R39)** isn't mentioned in the brief. Is it the same 1 per 30 days as Explorer, or unlimited? I assume same as Explorer unless you say otherwise.
- **Q3: Purchased Analysis Passes/credits.** Should a locked free user still be able to spend one to re-analyse (as today)? I recommend **yes**; removing it would strand people who have already paid.
- **Q4: Deploy scope.** You said don't deploy. Should I still **apply the migrations to the live DB** during development? RPC tests need them, and the frontend will break against a DB without the new RPCs. Or should I stop at committed SQL and a rolled-back test only?
- **Q5: Weather provider.** (a) **OpenWeather One Call** (v4; the first 1,000 calls/day are free, then US$0.0015 each; card required; commercial use allowed). Our cached load of ~320/day fits the free allowance. I recommend this. (b) **Open-Meteo API Standard**, a paid commercial licence (price not published on their pricing page; same data model as the free API). (c) Build with Open-Meteo's free endpoint behind the adapter for development only and switch before launch. Not recommended, because it would be a live licence breach if it shipped.
- **Q6: Branch/push.** This cloud session's container is temporary, so unpushed commits are lost if it's reclaimed. May I push `feat/free-first-formulator-weather` to origin (push only, no PR/merge/deploy)?

---

## Build status (2026-09-24)

Answers applied: Q1 (a) summary-only for anonymous visitors, PDF kept free · Q2 Glow Lite = Explorer limits · Q3 passes still spendable · Q4 additive migrations applied live · Q5 OpenWeather · Q6 branch pushed.

Deviations from the plan above, and why:
- **Weather city** is a new `profiles.weather_city_key`, not the existing `profiles.city`. That field is the free-text *address* city (any town), and saving "Cape Town" into it from the card would overwrite someone's address. `profiles.city` is still used as a fallback when it names one of the 10 cities.
- **Rolling window counts from the last *free* analysis** (`last_free_analysis_at`). Spending a purchased Analysis Pass doesn't push the next free one further away.
- **OpenWeather One Call 4.0 is the default** (the subscription page only offers 4.0 to new accounts): 3 calls per refresh, so the per-city cache is 60 min (≤720 calls/day). The 3.0 adapter remains, selectable with `OPENWEATHER_ONECALL_VERSION=3.0`.
- Found and fixed/flagged along the way: see the 2026-09-24 entry in CLAUDE.md (broken `start_free_trial`, trigger regression, stale static prices).

Applied live on `gnkpzijxuciiaamakgzm`: `20260924100000_formulator_rolling_allowance`, `20260924110000_skin_weather_cache`, `20260924110100_profiles_weather_city`, `20260924100200_fix_trial_start_email_idempotency_key` (applied at the user's request, verified).

**Still to do (needs a human):**
1. ~~Deploy the frontend, then immediately apply `20260924100100_formulator_allowance_cutover.sql`.~~ **Done 2026-09-24**: PR #141 merged (`c809a12`), production deploy READY, cutover applied right after; 19 server assertions pass live.
2. ~~Apply the trial fix~~ — done 2026-09-24.
3. Subscribe to OpenWeather **One Call API 4.0** ("One Call by Call"; card required, first 1,000 calls/day free — set the daily limit to 1000), then `supabase secrets set OPENWEATHER_API_KEY=...` — secret set; `skin-weather` deployed 2026-09-24 (v1). Waiting on OpenWeather to accept the key: first call got 401, and a re-check at 12:10 UTC (~2h later) still got 401. After the user reset the key, it works (13:50 UTC: Johannesburg 200, cache row written) — **done**.
4. Optionally update `src/data/plans.ts` fallback prices (Insider R99 → R79, VIP R299 → R199).
