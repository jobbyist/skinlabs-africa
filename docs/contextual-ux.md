# Contextual UX: how SkinLabs decides what to show

SkinLabs should answer one question for every member, on every surface:
**"What is the most useful thing for this member right now?"** This document is the
map of the system that answers it. Extend that system; don't bypass it.

Everything under `src/lib/context/` is pure (no React, no Supabase, no browser APIs)
and unit tested in `src/lib/__tests__/contextEngine.test.ts`. It is **presentation
only**: entitlements (`entitlements.ts`), RLS and the SECURITY DEFINER RPCs stay the
real gates. A wrong guess here can show the wrong button; it can never grant anything.

## The pipeline

```
Supabase (one cached read)  ->  ContextFacts  ->  states  ->  eligible actions
                                                              -> drop completed
                                                              -> drop fatigued
                                                              -> score -> primary + secondary
```

| Step | Where |
|---|---|
| Read the member once | `useAppContext()` — `src/hooks/use-app-context.ts` (react-query, key prefix `["member-context"]`, 20 s stale, shared by every consumer on the page) |
| Facts (plain data) | `ContextFacts` — `src/lib/context/types.ts`. Pure builders: `facts.ts` (`advancedStatusFromReports`, `isRoutineReviewDue`, `trialDaysLeftFrom`) |
| Derive states | `deriveContextStates(facts)` — `src/lib/context/states.ts` |
| Choose actions | `resolveContext(facts, { surface, ledger })` — `src/lib/context/actions.ts` |
| Fatigue / dismissal | `src/lib/context/ledger.ts` (pure) + `ledgerStore.ts` (per-account localStorage) |
| Use it in a component | `useContextualActions(surface)` — `src/hooks/use-contextual-actions.ts` |
| Navigation emphasis | `contextualNavigation(facts)` — `src/lib/context/navigation.ts` |
| Greeting / empty states | `contextualGreeting`, `emptyStateCopy` — `src/lib/context/copy.ts` |

## States (derived, never stored)

A member holds several at once, e.g. `INSIDER_MEMBER + BASIC_ANALYSIS_COMPLETED +
ROUTINE_AVAILABLE + PRODUCT_RESEARCHER`.

`VISITOR` · `NEW_USER` · `ONBOARDING` · `PROFILE_INCOMPLETE` ·
`BASIC_ANALYSIS_NOT_STARTED` · `BASIC_ANALYSIS_COMPLETED` ·
`ADVANCED_ANALYSIS_AVAILABLE` · `ADVANCED_ANALYSIS_PENDING` · `ADVANCED_ANALYSIS_COMPLETED` ·
`ROUTINE_AVAILABLE` · `ROUTINE_NOT_CREATED` · `ROUTINE_REVIEW_DUE` · `CONFLICT_CHECK_AVAILABLE` ·
`ACTIVE_EXPLORER` · `CONTENT_READER` · `PRODUCT_RESEARCHER` · `RETURNING_USER` · `INACTIVE_USER` ·
`FREE_MEMBER` · `LITE_MEMBER` · `INSIDER_MEMBER` · `VIP_MEMBER` · `TRIALING` · `LAPSED`

Thresholds (inactive after 14 days, 3 reads = content reader, …) are in
`CONTEXT_THRESHOLDS` so a rule and its test can't drift.

Definitions worth knowing:

- `PROFILE_INCOMPLETE` is the narrow `is_profile_complete()` gate (username, name,
  date of birth, skin type), **not** the encouragement-only "profile strength".
- `ROUTINE_AVAILABLE` = `has_smart_routine_access()` (a saved Basic analysis, or a
  non-rejected Advanced submission). `ROUTINE_NOT_CREATED` = no tracker steps and no
  Smart Routine. `ROUTINE_REVIEW_DUE` = a newer analysis/report exists since the
  routine was built, or it is 60+ days old.
- `CONFLICT_CHECK_AVAILABLE` = has a routine **and** holds `routine.conflict_matcher`
  (Insider / VIP). Others are pointed at the free Ingredient Combination Checker.
- Advanced status folds `getReportDisplayStatus()` of the member's submissions:
  a released result wins; pending intake / preparing / in review = pending; failed or
  not-released (pass refunded) = none.

## Actions

An action is one entry in `ACTIONS` (`actions.ts`):

| Field | Meaning |
|---|---|
| `id` | Stable token. Also the analytics value and the ledger key |
| `feature` | `skynn_basic`, `skynn_advanced`, `routine`, `ingredients`, `content`, `membership`, `profile`, `discovery`. **One secondary action per feature** is ever shown |
| `surfaces` | Where it may appear (`dashboard`, `home_hero`, `analysis_results`, `routine`, `content_end`, `empty_state`, `welcome`) |
| `priority` | 0-100 base rank; ties break on `id` so results are deterministic |
| `eligible(facts, states)` | Should it exist for this member at all |
| `completed(facts, states)` | Already done? Then it is **replaced**, not repeated (reported as `suppressed: completed`) |
| `completeOnClick` | Discovery actions: one click counts as having discovered it |
| `fatigue` | `essential` (never throttled), `maxDays`/`windowDays` (distinct SAST days shown), `dismissCooldownDays`, `clickCooldownDays` |
| `surfaceLabels` | Copy that differs by surface (the hero keeps its own wording) |
| `build(facts)` | `{ label, reason, kind, href }`. `reason` is one honest line ("Based on your routine…"), never "we noticed you…" |

Resolution: `primary` = highest score; `secondary` (default 2) must not share a
`feature` or a destination with anything already offered. `resolveContext` also
returns `suppressed: [{ id, reason }]` so every omission is explainable.

### Priority ladder (top wins)

`save_analysis` 100 · `resume_basic` 95 · `advanced_review` 92 · `start_basic` 90 ·
`build_routine` 88 · `advanced_status` 85 · `update_routine` 78 · `check_in` 72 ·
`advanced_start` 62 · `reanalyse` 58 · `start_trial` 56 · `conflict_matcher` 52 ·
`ingredient_checker` 50 · `continue_reading` 47 · `continue_podcast` 46 ·
`compare_products` 44 · `read_briefing` 42 · `routine_builder_pitch` 40 ·
`listen_latest` 40 · `advanced_get_pass` 30 · `seasonal_guide` 28

Value before the ask: nothing commercial outranks the thing that makes SkinLabs useful.

### Suppression rules (the "never ask twice" guarantees)

- Basic analysis done -> `start_basic` / `resume_basic` are gone; `build_routine` replaces them.
- Advanced submitted -> neither `advanced_start` nor `advanced_get_pass` is offered; `advanced_status` is.
- Advanced released -> `advanced_review` until opened once (`MarkResultViewed`), then `update_routine`.
- Routine exists -> `build_routine` is gone; `check_in` until today's steps are ticked.
- Advanced is never promoted before a Basic analysis exists, nor when the rollout is closed.
- Discovery actions (checker, matcher, compare, seasonal) vanish after one click or the
  frequency cap, and for a month after a dismissal.
- Trial-ending / lapsed messaging is **not** an action. The dashboard's trial banner
  (`trialLifecycle.ts`) owns it, so exactly one place asks.

## Membership rules

- Never promote what the member already has. Insider and VIP are never offered the
  Intelligent Routine Builder as an upgrade.
- `routine_builder_pitch` is a **capability boundary prompt**: only on the `routine` and
  `empty_state` surfaces, never a dashboard card. Explorer: "Unlock the Intelligent
  Routine Builder" (a no-card trial if available). Lite: "Go deeper with…".
- `start_trial` only for a free account that has not trialled and already has a skin profile.
- The Advanced AI Dermatology Analysis needs an Analysis Pass on every plan. Membership
  never grants it, so `advanced_start` requires `analysisPasses > 0`.
- Gates still use `useConversionAction` (see CLAUDE.md); `/pricing` is never the primary action.

## Surfaces already wired

| Surface | Component | Notes |
|---|---|---|
| `dashboard` | `NextActionCard` (Home) | greeting + 1 primary + ≤2 secondary; everything else on Home informs |
| `home_hero` | `Hero` via `useHeroCtas` | prerenders a stable default, then adapts |
| `analysis_results` | `ResultsNextSteps` | routine first; Advanced only in the form that fits |
| `content_end` | `SkynnMiniCta` | members with a profile get their next step, not the invitation |
| `welcome` | `/welcome` finish | hands the member to their next action, dashboard as fallback |
| `empty_state` | `ContextualEmptyState` | Saved, Journey |
| navigation | `FloatingBottomNav` | profile members: Home · My Skin · Routine · Explore · Account |

## Adding a contextual action

1. Add the **fact** if it isn't there: extend `ContextFacts`, fill it in `useAppContext`
   (and prefer a pure builder in `facts.ts` with a test). Never query a table from the
   component that wants to show the CTA.
2. Add one `ACTIONS` entry: surfaces, priority, eligibility, `completed`, fatigue, copy.
3. Add test rows in `contextEngine.test.ts`: eligible, completed, fatigued, wrong tier.
4. Render it through `useContextualActions(surface)`. Call `click(action)` on use.
   Call `notifyMemberContextChanged()` from whatever mutation makes the action done.

Don't: hand-roll `if (hasAnalysis) ...` CTA logic in a component; add a second
snapshot query; show an action that is not in the catalogue; schedule timers from
far-future dates (see the 2^31 ms bug in CLAUDE.md).

## Fatigue ledger

Per account, per device (`skinlabs:cta-ledger:<userId>`), counters and ids only:
days shown (≤30), clicks, last click, dismissed-at, completed-at. One impression per
action per SAST day. Dismissing hides an action everywhere. The ledger never holds
skin data, content titles or emails and never leaves the browser.

## Analytics

All through `trackContextEvent()` (`src/lib/context/analytics.ts`), a strict whitelist of
tokens and small counts (`action`, `surface`, `feature`, `state`, `previous_state`,
`reason`, `tier`, `count`). Events: `context_resolved`, `journey_state_changed`,
`dashboard_primary_action_shown|clicked`, `contextual_cta_shown|clicked|dismissed`,
`contextual_cta_suppressed` (an action replaced because it was completed),
`cta_repetition_suppressed` (fatigue / dismissal), `feature_discovery_shown|clicked`,
`recommendation_shown|clicked` (the for-you feed), `onboarding_completed`. The existing
`skynn_recommendation_*` events keep covering the Smart Routine picks.

## When the data can't be read

A failed read must never be mistaken for "the member has done nothing" (that would tell
someone with an analysis to take one). `loadCore` throws if the profile, analysis,
routine, check-in, Smart Routine or report reads fail; react-query keeps any earlier data,
and with none `useAppContext().unavailable` is true: `useContextualActions` resolves to
no action, the dashboard says "We couldn't load your latest activity just now" with a retry,
and the hero falls back to its static default. Optional reads (advanced access, push
devices, MFA) fail safe: Advanced simply isn't offered.

## Performance and privacy notes

- Dashboard sections other than Home are lazy chunks (`components/dashboard/lazyTabs.ts`),
  warmed on tab hover/focus. Home no longer ships the analysis flow, PDF and chart
  libraries (~850 kB).
- One shared snapshot per page (react-query) replaces separate profile / journey /
  smart-routine / allowance / advanced reads on Home. `useNewsArticles` and the Smart
  Routine hooks now share cached requests too.
- The member snapshot runs only where a decision needs it (dashboard, hero, results,
  empty states, members' article footers). Site-wide, navigation uses a one-bit
  per-account hint (`skinlabs:has-skin-profile:<id>`).
- The service worker is untouched: it only caches same-origin GETs and three public
  tables; none of this data is cached by it (see `docs/pwa.md`).
- Personalisation reads the member's **own** submissions, never `analytics_events`.
  Photos are never analysed and Monk Skin Tone is never inferred.
