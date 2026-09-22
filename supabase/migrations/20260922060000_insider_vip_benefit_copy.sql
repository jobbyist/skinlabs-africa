-- Pricing copy update (content-only, no schema change):
-- - Glow Insider gains "Intelligent Routine Builder on every review page"
--   (previously a Glow VIP-only benefit).
-- - Glow VIP's "Intelligent Routine Builder on every review page" line is
--   replaced with "Exclusive access to the OpenHaus Marketplace".
--
-- Note: OpenHaus (/marketplace/*) is currently behind a blanket
-- team/partner-credential + waitlist gate for EVERY visitor regardless of
-- tier (src/components/marketplace/MarketplaceGate.tsx, public launch
-- 2026-11-01) — there is no VIP-specific bypass wired up yet, and Glow VIP
-- itself isn't purchasable today (is_purchasable = false, "Coming soon").
-- This is forward-looking plan copy for a tier that isn't on sale yet, not a
-- claim being made to a paying customer today — but if/when VIP goes on
-- sale, actual tier-based marketplace access should be wired up before or
-- alongside that launch so this benefit is true in practice, not just copy.

UPDATE public.pricing_plans
   SET benefits = '["A live AI routine that re-analyses your skin every week","Intelligent Routine Builder on every review page","Full podcast library and unlimited reviews","Full Spotlight brand profiles and practitioner directory","Active Ingredient Conflict Matcher for your SKYNN AI routine","Ingredient Combination Checker","Member-only ingredient deep dives","30-day money-back guarantee"]'::jsonb
 WHERE plan_id = 'insider' AND variant_key = 'control';

UPDATE public.pricing_plans
   SET benefits = '["Everything in Glow Insider","Exclusive access to the OpenHaus Marketplace","Virtual derm consultations — launching soon","Ad-free & offline browsing","VIP badge"]'::jsonb
 WHERE plan_id = 'vip' AND variant_key = 'control';
