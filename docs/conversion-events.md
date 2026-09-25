# Conversion events

This is a reference for every `trackConversionEvent()` call in the app, as it stood on
2026-09-24 (onboarding overhaul, prompt 00: baseline). The source of truth is
the `ConversionEvent` union in `src/lib/analytics-events.ts`. If this file and the code
disagree, the code is right. When you add, move or remove a call, update this file too.

## How an event is recorded

`trackConversionEvent(event, payload)` writes to two places. Neither write is awaited,
and neither can throw into the caller.

1. **Vercel Web Analytics**: `track(event, { ...payload, path })`.
2. **Supabase `analytics_events`**: `{ event_name, payload, path, user_id }`. The
   `user_id` comes from the cached session and is `null` for anonymous visitors. The
   admin Analytics tab reads this table.

Every event gets `path` (`window.location.pathname`) added automatically, so the
**Props** columns below leave it out.

## Server-side baseline: `conversion_funnel_daily`

These client events are a record of what happened in the browser. They can be blocked,
fire twice, or fire before the server confirms the action. The authoritative counts
come from the admin-only view `public.conversion_funnel_daily` (migration
`20260924120000_conversion_funnel_daily.sql`). It has one row per SAST day for the last
365 days, holds counts only, and returns zero rows unless the caller has
`has_role(auth.uid(),'admin')`. The `anon` role has no access at all.

| Column | Source |
| --- | --- |
| `signups` | `auth.users.created_at` |
| `starter_analyses_saved` | Delivered `skincare_recommendations` rows with `result_payload` set (starter rows only; live-AI rows never set it) |
| `trials_started` | `profiles.trial_used_at` |
| `live_subscriptions_created` | `payment_subscriptions.created_at` where the status is currently `trialing` / `active` / `past_due` |
| `paid_subscriptions_started` | `profiles.subscription_started_at` where `subscription_status` is currently in `PAID_SUBSCRIPTION_STATUSES` (pinned by `src/lib/__tests__/conversionFunnel.test.ts`) |

The last two columns reflect **current** state. For example, a subscription that was
created on a given day and later cancelled no longer counts toward that day.

```sql
select * from public.conversion_funnel_daily where day >= current_date - 30;
```

## Events by funnel stage

### Acquisition and auth: `AuthDialog.tsx`, `ResetPassword.tsx`, `use-admin-gate.ts`

| Event | Where it fires | Props |
| --- | --- | --- |
| `auth_started` | `AuthDialog.tsx`: the dialog opens | `defaultTab`, `hasPendingPlan` |
| `signup_started` | `AuthDialog.tsx`: Google / magic-link / password sign-up submitted | `method` (`google` \| `magic_link` \| `password`) |
| `signup_started` | `AIFormulator.tsx`: "Save your results" sign-up opened from results | `source: "ai_formulator_results"` |
| `signup_completed` | `AuthDialog.tsx`: `signUp()` returned no error | none |
| `signup_completed` | `AIFormulator.tsx`: account created from the results gate | `source: "ai_formulator_results"` |
| `signin_completed` | `AuthDialog.tsx`: password sign-in succeeded | none |
| `password_reset_started` | `AuthDialog.tsx`: "Forgot password" submitted | none |
| `password_reset_completed` | `ResetPassword.tsx`: new password saved | none |
| `admin_login_success` / `admin_login_failure` | `use-admin-gate.ts`: `/admin` password gate | none |

`signup_completed` fires when `signUp()` returns without an error, which can happen
before the user confirms their email. It counts sign-up **submissions**. Use the
`signups` column of `conversion_funnel_daily` for real accounts.

### SKYNN AI formulator: `AIFormulator.tsx` unless noted

| Event | Where it fires | Props |
| --- | --- | --- |
| `analysis_started` | Analysis started from the intro | `advancedPass: true` when a pass is used, otherwise none |
| `formulator_started` | Same moment as `analysis_started` | `accountState` (`anonymous` \| `free` \| `member`), optional `advancedPass` |
| `consent_completed` | Consent step accepted | none |
| `starter_question_skipped` | Photo step skipped | `step: "photo"` |
| `profile_completed` | Profile step completed | none |
| `starter_question_viewed` / `_answered` / `_back` | Each quiz question shown / answered / "Back" | `questionId` |
| `analysis_generated` | Live-AI (member) result returned | `resultTier` (`data.tier`, default `"premium"`) |
| `analysis_generated` | Starter (free) result computed | `resultTier: "free"` |
| `formulator_completed_anonymous` | Starter result computed (fires next to the one above) | `skinType` |
| `analysis_viewed` | Results screen shown | `resultTier` |
| `starter_save_cta_viewed` | "Save your results" CTA rendered | none |
| `results_saved` | Result attached to the account | `resultTier` |
| `starter_account_link_completed` / `starter_account_link_failed` | `save_starter_analysis` attach succeeded / failed | failed: `message` |
| `starter_account_creation_failed` | Sign-up from the results gate failed | `message` |
| `signup_from_formulator` | Account created from the results gate | `hasResult` |
| `starter_feedback_submitted` | Accuracy feedback sent | `accuracy`, `reason` |
| `starter_result_refined` | Result refined after feedback | `reason` |
| `upgrade_viewed` | Starter allowance used up | `feature: "ai_analysis.starter_allowance"`, `accountState: "free"` |
| `reanalysis_blocked` | `ReanalysisLockedPanel.tsx` / `SkinProfileHero.tsx`: rolling window locks a re-run | `source` |
| `upgrade_clicked_from_formulator` | `ReanalysisLockedPanel.tsx` / `AnalysisCreditsCard.tsx` upgrade CTA | `source` |
| `upgrade_click` | `useConversionAction().run()` (see "Gate CTAs" below). Here: `PremiumUpsellSection` (`starter_results_upsell`), `ReanalysisLockedPanel` (`reanalysis_locked:<source>`), `AnalysisCreditsCard` (`dashboard_credits`), `FormulatorTab` (`dashboard_formulator_tab`) | `source`, `kind`, `feature` |
| `skynn_video_opened` / `skynn_video_completed` | `skynn/SkynnVideoModal.tsx` | `source: "ai_formulator_intro"` |
| `starter_dashboard_arrived` | `UserDashboard.tsx`: a pending local starter result was saved on arrival at the dashboard | none |

### Advanced AI Dermatology Report and Analysis Passes

| Event | Where it fires | Props |
| --- | --- | --- |
| `advanced_assessment_upsell_viewed` | `AIFormulator.tsx` (pre-analysis, during analysis, results), `dashboard/AdvancedAssessmentCard.tsx` | `funnelLocation`, `accessState` (`member` \| `pass_holder` \| `none`, not sent during analysis) |
| `advanced_assessment_upsell_clicked` | Same surfaces | `funnelLocation` |
| `advanced_assessment_membership_cta_clicked` | Membership CTA in the pre-analysis, results and dashboard surfaces | `funnelLocation` |
| `advanced_assessment_access_denied` | `AIFormulator.tsx`: advanced run requested with no pass | `reason: "no_analysis_pass"` |
| `advanced_analysis_started` | `AIFormulator.tsx`: results-screen advanced CTA | none |
| `advanced_analysis_cta_clicked` | `AIFormulator.tsx`, `AdvancedAssessmentCard.tsx` | `cta` (`use_pass` \| `get_pass`), optional `funnelLocation` |
| `analysis_pass_used` | `AIFormulator.tsx`: pass consumed | none |
| `analysis_pass_purchase_viewed` | Purchase modal opened (formulator, dashboard) | `source` |
| `analysis_pass_package_selected` | `AnalysisPassPurchaseModal.tsx` | `packId`, `credits` |
| `analysis_pass_balance_viewed` | `dashboard/AnalysisPassesCard.tsx` | `balance`, `source: "dashboard"` |

### Pricing, trial and checkout

| Event | Where it fires | Props |
| --- | --- | --- |
| `pricing_view` | `Pricing.tsx`: page mounted | none |
| `credit_pack_viewed` | `Pricing.tsx`: credit packs loaded | none |
| `founding_member_viewed` | `Pricing.tsx`: an active founding offer loaded | `offerId` |
| `plan_selected` | `Pricing.tsx` `beginCheckout()`: the subscribe (non-trial) checkout dialog opens for a signed-in user | `plan`, `interval` |
| `membership_plan_selected` | `Pricing.tsx`: plan chosen, before auth or checkout | `plan`, `kind` (`subscribe` \| `trial`) |
| `trial_activation_started` / `trial_activation_failed` | `Pricing.tsx`: no-card trial path; `useStartTrial()` (gate CTAs, which add `source`) | `plan` (+ `reason` on failure, `source` from `useStartTrial`) |
| `trial_started` | `lib/trial.ts`: `start_free_trial` RPC succeeded | `plan` |
| `trial_started` | `payments/MembershipCheckoutDialog.tsx`: PayPal subscription approved with a new trial | `plan` |
| `checkout_started` | `lib/payments.ts`: redirect checkout for a plan / credit pack / founding member | `purchaseType`, `gateway`, plus `plan`+`interval` \| `packId` \| `offerId` |
| `checkout_completed` | `MembershipCheckoutDialog.tsx`: inline PayPal subscription approved | `purchaseType: "plan"`, `plan`, `interval`, `gateway: "paypal"` |
| `checkout_completed` | `UserDashboard.tsx`: `?payment=success` poll confirms the grant | `purchaseType` |
| `subscription_started` | `UserDashboard.tsx`: poll sees a paid status | `plan`, `interval` (from the query string) |
| `credit_pack_purchased` | `UserDashboard.tsx` poll, `AnalysisPassPurchaseModal.tsx` and `Pricing.tsx` inline PayPal approval | `packId` |
| `founding_member_purchased` | `UserDashboard.tsx` poll, `Pricing.tsx` inline PayPal approval | `offerId` |
| `upgrade_viewed` | `FeatureGate.tsx` (overlay), `UpgradePrompt.tsx` (inline) | `feature`, `accountState`, `style` |
| `upgrade_click` | Every gate CTA via `useConversionAction` (list below) | `source`, `kind` (`signup`/`trial`/`subscribe`), `feature` (undefined = general membership) |

### Engagement and other site-wide events

| Event | Where it fires | Props |
| --- | --- | --- |
| `smart_routines_page_view` | `SmartRoutines.tsx` mount | `authenticated`, `tier`, `hasAnalysisPass` |
| `smart_routines_cta_clicked` | `SmartRoutines.tsx` CTAs | `location`, `tier`, `authenticated`, `hasAnalysisPass` |
| `routine_checkin_completed` | `use-routine.ts` | `slot` |
| `newsletter_subscribed` | `Newsletter.tsx` | none |
| `brand_request_submitted` | `BrandRequestModal.tsx` | `mode` |
| `partner_enquiry_submitted` | `partners/PartnerEnquiryForm.tsx` | `partnership_model` |
| `consultation_booking_requested` | `Consultations.tsx` | `practitioner_id` |
| `ingredient_checker_checked` | `use-ingredient-compatibility.ts` | `found`, `interaction_type` |
| `site_search_result_clicked` | `SiteSearch.tsx` | `query` (trimmed, ≤100 chars), `href` |
| `marketplace_add_to_cart` | `CartContext.tsx` | `productId`, `quantity` |
| `podcast_played` / `podcast_liked` / `podcast_shared` | `use-podcast-engagement.ts` | `episode_slug` |
| `account_deactivated` / `account_deletion_requested` | `dashboard/AccountTab.tsx` | none |

### Gate CTAs: `useConversionAction` (onboarding overhaul 03, 2026-09-25)

Every paywall/gate CTA runs through `src/hooks/use-conversion-action.ts` and fires one
`upgrade_click { source, kind, feature }` when clicked. `kind` tells you what the click did:
`signup` (opened AuthDialog in sign-up mode, `unlock` intent recorded), `trial` (started an
Insider trial in place, then `trial_activation_*` fire with the same `source`) or `subscribe`
(opened `MembershipCheckoutDialog`). Sources:

| Source | Where |
|---|---|
| `feature_gate:<feature>` / `consultations_directory` | `FeatureGate` (default / Consultations) |
| `upgrade_prompt:<feature>` | `UpgradePrompt` default |
| `product_review_gate`, `product_review_cta` | `ProductReview.tsx` overlay and promo card |
| `product_review_gate_ssr`, `product_review_cta_ssr` | `routes/reviews.$slug.tsx` (SSR hard loads) |
| `routine_builder_gate` | `RoutineBuilder.tsx` |
| `shelf_showdown_limit` | `ComparisonArticle.tsx` |
| `podcast_transcript_gate`, `podcast_section` | `EpisodePage.tsx`, homepage `PodcastSection.tsx` |
| `spotlight_limit`, `spotlight_limit_ssr` | `SpotlightBrandProfile.tsx`, `routes/spotlight.$slug.tsx` |
| `briefing_weekly_limit`, `briefing_signed_out` | `NewsroomArticle.tsx` |
| `starter_results_upsell`, `reanalysis_locked:<source>`, `dashboard_credits`, `dashboard_formulator_tab` | SKYNN AI surfaces |
| `smart_routines` | `/routines` primary CTA and Insider access card |
| `billing_tab` | Dashboard Billing tab "Upgrade" (non-members) |

Before this change `upgrade_click` carried `{ feature, accountState }` (UpgradePrompt) or
`{ feature, accountState, source }` (PremiumUpsellSection), so rows before 2026-09-25 have
no `kind`.

## Declared but never fired

These names are in the `ConversionEvent` union, but no code path calls them. Don't build
reports on them until they're wired up:

`subscription_cancelled`, `starter_continue_without_account`,
`smart_routines_demo_interaction`, `smart_routines_faq_opened`,
`smart_routines_accessed`, `smart_routines_generated`, `dashboard_entered`.

## Things to know when reading the numbers

- **Double counting.** One user action can emit several events:
  `analysis_started` and `formulator_started`; `signup_completed` and
  `signup_from_formulator`; `checkout_completed` and `subscription_started` /
  `credit_pack_purchased`. Count one name per funnel step.
- **Several call sites for one name.** `credit_pack_purchased`, `trial_started`,
  `checkout_completed` and `signup_completed` each fire from more than one place (see
  the tables above). The redirect paths and the inline PayPal paths don't overlap for a
  single purchase.
- **Free-text props.** `site_search_result_clicked.query` holds what the user typed, and
  the `*_failed` events carry the error `message`. Both are stored in
  `analytics_events.payload`. Nothing else carries user-entered text.
