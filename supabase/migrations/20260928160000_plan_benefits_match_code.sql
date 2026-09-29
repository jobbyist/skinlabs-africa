-- Plan benefit copy now matches what the code actually gates (2026-09-28).
-- Each line is checked against src/lib/entitlements.ts, src/lib/access-quotas.ts,
-- get_article_body() (3 premium briefings / 7 days unless is_member()), the
-- live pricing_settings.free_analysis_window_days (7) and the ad policy in
-- src/lib/viewerContext.ts. Removed because nothing implements them:
--   * Glow Lite "Priority access to new Daily Skinny briefings" (Lite gets
--     the same 3/week as Explorer; only Insider+ is unlimited)
--   * Insider "Member-only ingredient deep dives" (no such content exists)
--   * VIP "Exclusive access to the OpenHaus Marketplace" (the marketplace is
--     public), "offline browsing" (no service worker / PWA ships) and
--     "VIP badge" (nothing renders one)
-- The Ingredient Combination Checker is free to every signed-in account, so
-- it's listed on Explorer instead of reading as a paid perk. The Routine
-- Builder moved from VIP to Insider (entitlements.ts) and stays on Insider.
-- Builds on 20260928142000_skynn_v21_plan_copy.sql (the legacy weekly live-AI
-- report is retired, so it is not advertised). Keep src/data/plans.ts (the
-- offline fallback) in sync.
UPDATE public.pricing_plans SET benefits = '[
  "One free Basic AI Skin Analysis every 7 days to see your real skin profile",
  "Public reviews, scores and Spotlight rankings",
  "3 full Daily Skinny briefings a week",
  "2 Shelf Showdowns and 3 Spotlight brand profiles a month",
  "Ingredient Combination Checker — free for a limited time"
]'::jsonb, updated_at = now() WHERE plan_id = 'explorer';

UPDATE public.pricing_plans SET benefits = '[
  "Everything in Glow Explorer",
  "Unlimited Shelf Showdowns and Spotlight brand profiles",
  "Practitioner directory",
  "30-day money-back guarantee"
]'::jsonb, updated_at = now() WHERE plan_id = 'glow_lite';

UPDATE public.pricing_plans SET benefits = '[
  "Everything in Glow Lite",
  "Unlimited Basic AI Skin Analysis — re-analyse whenever your skin changes",
  "Intelligent Routine Builder on every review page",
  "Unlimited Daily Skinny briefings, full reviews and the full podcast library",
  "Active Ingredient Conflict Matcher for your SKYNN AI routine",
  "Ad-light browsing",
  "30-day money-back guarantee"
]'::jsonb, updated_at = now() WHERE plan_id = 'insider';

UPDATE public.pricing_plans SET benefits = '[
  "Everything in Glow Insider",
  "Virtual derm consultations — launching soon",
  "Ad-free browsing"
]'::jsonb, updated_at = now() WHERE plan_id = 'vip';
