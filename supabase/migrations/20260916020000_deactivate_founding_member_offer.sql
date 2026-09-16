-- Removes the Founding Member pricing option (product decision). Zero
-- redemptions on the live offer at the time of this change, so nothing
-- is disrupted. is_active = false (not a delete) so the historical offer
-- record and its pricing/benefits are preserved -- usePricingConfig()'s
-- query already filters on is_active=true, so this alone makes
-- config.foundingOffer resolve to null and hides the Pricing page's
-- Founding Member section; the now-unreachable rendering code for it is
-- removed from src/pages/Pricing.tsx in the same change.
update public.founding_member_offers
set is_active = false
where name = 'Founding Member'
  and is_active = true;
