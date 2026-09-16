-- Product decision: lower Glow Insider and Glow VIP monthly/annual pricing,
-- and add the Ingredient Combination Checker as an explicit benefit on
-- Glow Lite and Glow Insider (Glow VIP already inherits it via its own
-- "Everything in Glow Insider" benefit line, matching how the Active
-- Ingredient Conflict Matcher was handled in
-- 20260916010000_pricing_plans_glow_lite_trial_removal.sql -- not
-- restated separately here for VIP to avoid a redundant display line).
-- Annual price kept at exactly 10x monthly (the existing "2 months free"
-- convention already used by every other plan).
update public.pricing_plans
set price_monthly = 79,
    price_annual = 790
where plan_id = 'insider'
  and variant_key = 'control';

update public.pricing_plans
set price_monthly = 199,
    price_annual = 1990
where plan_id = 'vip'
  and variant_key = 'control';

update public.pricing_plans
set benefits = '[
  "Everything in Explorer",
  "Unlimited product comparisons and Spotlight profiles",
  "Priority access to new Daily Skinny briefings",
  "Ingredient Combination Checker",
  "30-day money-back guarantee"
]'::jsonb
where plan_id = 'glow_lite'
  and variant_key = 'control';

update public.pricing_plans
set benefits = '[
  "A live AI routine that re-analyses your skin every week",
  "Full podcast library and unlimited reviews",
  "Full Spotlight brand profiles and practitioner directory",
  "Active Ingredient Conflict Matcher for your SKYNN AI routine",
  "Ingredient Combination Checker",
  "Member-only ingredient deep dives",
  "30-day money-back guarantee"
]'::jsonb
where plan_id = 'insider'
  and variant_key = 'control';
