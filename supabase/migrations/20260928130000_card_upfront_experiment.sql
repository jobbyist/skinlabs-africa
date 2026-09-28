-- Onboarding overhaul 11: the "card upfront" trial experiment, parked at 0%.
--
-- A browser bucketed into card_upfront sees the trial CTA open
-- KeepMembershipDialog first (card or PayPal tokenised at R0, first charge on
-- the trial-end date) instead of the one-tap no-card trial — see useStartTrial()
-- and src/lib/cardUpfront.ts. It has no pricing_plans / pricing_settings rows of
-- its own, so prices, trial length and the promo fall back to 'control' (the
-- client's mergeByVariant, resolveCharge() and start_free_trial() all do).
--
-- traffic_weight = 0: nobody is bucketed into it. It stays at 0 until a HUMAN
-- enables it, and not before 1 November 2026 (the promo's "no card required"
-- promise runs until then):
--   UPDATE public.pricing_experiment_variants SET traffic_weight = 10 WHERE variant_key = 'card_upfront';
INSERT INTO public.pricing_experiment_variants (variant_key, traffic_weight, is_active, description)
VALUES (
  'card_upfront',
  0,
  true,
  'Trial CTA asks for a card/PayPal first (R0 tokenisation, first charge on trial end). Weight 0 until a human enables it after 1 Nov 2026.'
)
ON CONFLICT (variant_key) DO NOTHING;
