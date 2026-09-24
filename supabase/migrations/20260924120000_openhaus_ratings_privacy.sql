-- Raw marketplace_product_user_ratings rows (user_id + rating + review_text)
-- were readable by anon/authenticated via a USING (true) SELECT policy.
-- Clients only need the public aggregate and a signed-in user's own row, so
-- raw rows are now author-only and the aggregate is served from a
-- trigger-maintained stats table that holds no user-level data.
--
-- The view deliberately stays security_invoker = true: flipping it to run
-- as its owner would let it read past the author-only RLS, which the
-- security advisor flags as a "Security Definer View".
--
-- Written to converge on one end state whether it runs after the committed
-- core migration (single FOR ALL owner policy) or the live project (policies
-- split per command by openhaus_marketplace_perf_hardening).

-- ---------- 1. Aggregate-only stats table ----------
CREATE TABLE IF NOT EXISTS public.marketplace_product_rating_stats (
  product_id uuid PRIMARY KEY REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  avg_rating numeric NOT NULL,
  rating_count bigint NOT NULL CHECK (rating_count > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_product_rating_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketplace rating stats" ON public.marketplace_product_rating_stats;
CREATE POLICY "Public can view marketplace rating stats"
  ON public.marketplace_product_rating_stats FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.marketplace_product_rating_stats FROM anon, authenticated;
GRANT SELECT ON public.marketplace_product_rating_stats TO anon, authenticated;
GRANT ALL ON public.marketplace_product_rating_stats TO service_role;

-- ---------- 2. Keep stats in sync with raw ratings ----------
CREATE OR REPLACE FUNCTION public.refresh_marketplace_product_rating_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected uuid[] := '{}';
  pid uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    affected := array_append(affected, OLD.product_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    affected := array_append(affected, NEW.product_id);
  END IF;

  FOR pid IN SELECT DISTINCT x FROM unnest(affected) AS x LOOP
    -- Serialise concurrent writers per product; under READ COMMITTED the
    -- aggregate below then sees every committed rating.
    PERFORM pg_advisory_xact_lock(hashtextextended(pid::text, 0));

    INSERT INTO public.marketplace_product_rating_stats (product_id, avg_rating, rating_count, updated_at)
    SELECT pid, round(avg(r.rating)::numeric, 2), count(*), now()
    FROM public.marketplace_product_user_ratings r
    WHERE r.product_id = pid
    HAVING count(*) > 0
    ON CONFLICT (product_id) DO UPDATE
      SET avg_rating = EXCLUDED.avg_rating,
          rating_count = EXCLUDED.rating_count,
          updated_at = EXCLUDED.updated_at;

    IF NOT FOUND THEN
      DELETE FROM public.marketplace_product_rating_stats WHERE product_id = pid;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_marketplace_product_rating_stats() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS refresh_marketplace_product_rating_stats ON public.marketplace_product_user_ratings;
CREATE TRIGGER refresh_marketplace_product_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_product_user_ratings
FOR EACH ROW
EXECUTE FUNCTION public.refresh_marketplace_product_rating_stats();

-- Backfill from any ratings that already exist.
INSERT INTO public.marketplace_product_rating_stats (product_id, avg_rating, rating_count, updated_at)
SELECT product_id, round(avg(rating)::numeric, 2), count(*), now()
FROM public.marketplace_product_user_ratings
GROUP BY product_id
ON CONFLICT (product_id) DO UPDATE
  SET avg_rating = EXCLUDED.avg_rating,
      rating_count = EXCLUDED.rating_count,
      updated_at = EXCLUDED.updated_at;

-- ---------- 3. Public aggregate view (same columns the app already reads) ----------
CREATE OR REPLACE VIEW public.marketplace_product_internal_rating_summary
WITH (security_invoker = true) AS
SELECT product_id, avg_rating, rating_count
FROM public.marketplace_product_rating_stats;

GRANT SELECT ON public.marketplace_product_internal_rating_summary TO anon, authenticated, service_role;

-- ---------- 4. Raw ratings: author-only ----------
DROP POLICY IF EXISTS "Public can view internal marketplace ratings" ON public.marketplace_product_user_ratings;
DROP POLICY IF EXISTS "Users manage their own marketplace rating" ON public.marketplace_product_user_ratings;
DROP POLICY IF EXISTS "Users view their own marketplace rating" ON public.marketplace_product_user_ratings;
DROP POLICY IF EXISTS "Users insert their own marketplace rating" ON public.marketplace_product_user_ratings;
DROP POLICY IF EXISTS "Users update their own marketplace rating" ON public.marketplace_product_user_ratings;
DROP POLICY IF EXISTS "Users delete their own marketplace rating" ON public.marketplace_product_user_ratings;

CREATE POLICY "Users view their own marketplace rating"
  ON public.marketplace_product_user_ratings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert their own marketplace rating"
  ON public.marketplace_product_user_ratings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update their own marketplace rating"
  ON public.marketplace_product_user_ratings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete their own marketplace rating"
  ON public.marketplace_product_user_ratings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL ON public.marketplace_product_user_ratings FROM anon;
REVOKE ALL ON public.marketplace_product_user_ratings FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_product_user_ratings TO authenticated;
GRANT ALL ON public.marketplace_product_user_ratings TO service_role;
