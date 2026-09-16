-- Removes the free trial from Glow Lite (product decision) and adds the
-- real, currently-live Active Ingredient Conflict Matcher benefit to Glow
-- Insider's plan copy -- it's gated to insider/vip in
-- src/lib/entitlements.ts's LADDER_CAPABILITIES (routine.conflict_matcher)
-- and rendered via ConflictMatcherPanel.tsx, but was never reflected in the
-- pricing_plans.benefits copy the Pricing page reads. VIP's own row already
-- opens with "Everything in Glow Insider", which covers it there without a
-- duplicate line, matching the existing copy convention for that plan.
--
-- start_free_trial() (see 20260906180000_entitlement_foundations.sql and
-- later migrations) already reads trial_eligible/trial_days from this same
-- table and raises "This plan has no free trial" when ineligible, so this
-- is a full, server-enforced removal, not just a UI change.

update public.pricing_plans
set trial_eligible = false,
    trial_days = 0
where plan_id = 'glow_lite'
  and variant_key = 'control';

update public.pricing_plans
set benefits = '[
  "A live AI routine that re-analyses your skin every week",
  "Full podcast library and unlimited reviews",
  "Full Spotlight brand profiles and practitioner directory",
  "Active Ingredient Conflict Matcher for your SKYNN AI routine",
  "Member-only ingredient deep dives",
  "30-day money-back guarantee"
]'::jsonb
where plan_id = 'insider'
  and variant_key = 'control';
