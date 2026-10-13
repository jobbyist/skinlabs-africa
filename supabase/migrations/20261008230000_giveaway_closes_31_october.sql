-- October 2026 Skin Story Giveaway: entries now close 31 Oct 2026 12:00 SAST (owner, 2026-10-08), was 15 Oct 23:59:59.
-- Keep in sync with GIVEAWAY_CLOSES_AT in src/lib/giveaway/campaign.ts (a unit test reads this file).
CREATE OR REPLACE FUNCTION public.giveaway_closes_at()
RETURNS timestamptz LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path TO ''
AS $$ SELECT timestamptz '2026-10-31 12:00:00+02' $$;
