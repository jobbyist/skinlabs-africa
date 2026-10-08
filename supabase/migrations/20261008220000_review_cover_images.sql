-- Real product images for published reviews.
--  review_image_candidates  images found on the brand's own site / the listed retailer's product page (pending until a person approves)
--  review_images            the PUBLISHED cover (existing table). New columns mark a real product image vs a stock photo.
--  review_price_targets     gains image scheduling columns, so every review (incl. every future generated review, via the
--                           existing trigger) is picked up by the review-image-sync job without touching the generation pipeline.
-- Approving a candidate (admin_decide_review_images) is the only way a real image becomes a review's cover.

ALTER TABLE public.review_images ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'stock';
ALTER TABLE public.review_images ADD COLUMN IF NOT EXISTS source_page_url text;
ALTER TABLE public.review_images ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.review_images ADD COLUMN IF NOT EXISTS verified_by uuid;
CREATE INDEX IF NOT EXISTS review_images_product_idx ON public.review_images (source_kind) WHERE source_kind = 'product';

ALTER TABLE public.review_price_targets ADD COLUMN IF NOT EXISTS image_checked_at timestamptz;
ALTER TABLE public.review_price_targets ADD COLUMN IF NOT EXISTS image_next_check_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.review_price_targets ADD COLUMN IF NOT EXISTS image_found integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS review_price_targets_image_due_idx ON public.review_price_targets (image_next_check_at);

CREATE TABLE IF NOT EXISTS public.review_image_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id       text NOT NULL REFERENCES public.review_price_targets (review_id) ON DELETE CASCADE,
  image_url       text NOT NULL CHECK (image_url ~ '^https://'),
  alt             text,
  source_page_url text NOT NULL,
  source_kind     text NOT NULL CHECK (source_kind IN ('brand', 'retailer')),
  source_label    text NOT NULL,
  via             text,
  match_confidence numeric,
  tool            text NOT NULL CHECK (tool IN ('parallel_search', 'nimble', 'manual')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),
  verified_by     uuid,
  verified_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, image_url)
);
CREATE INDEX IF NOT EXISTS review_image_candidates_status_idx ON public.review_image_candidates (status, created_at);
CREATE INDEX IF NOT EXISTS review_image_candidates_review_idx ON public.review_image_candidates (review_id);

ALTER TABLE public.review_image_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read review image candidates" ON public.review_image_candidates
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
REVOKE ALL ON public.review_image_candidates FROM anon, authenticated;
GRANT SELECT ON public.review_image_candidates TO authenticated;
GRANT ALL ON public.review_image_candidates TO service_role;

-- ---------- work queue (service role) ----------
-- A review is due when its image check is due AND it has no approved real image yet.
CREATE OR REPLACE FUNCTION public.get_review_image_targets(p_limit integer, p_review_id text DEFAULT NULL)
RETURNS TABLE (review_id text, product_name text, brand text, size_ml numeric, brand_domains text[], listing_urls text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.review_id, t.product_name, t.brand, t.size_ml, b.domains,
    COALESCE((SELECT array_agg(l.listing_url ORDER BY (l.retailer_slug = 'brand-direct') DESC, (l.status = 'approved') DESC, l.checked_at DESC)
                FROM public.review_price_listings l WHERE l.review_id = t.review_id AND l.status IN ('approved', 'pending')), ARRAY[]::text[])
  FROM public.review_price_targets t
  LEFT JOIN public.brand_websites b ON b.brand_key = regexp_replace(lower(t.brand), '[^a-z0-9]', '', 'g')
  WHERE (p_review_id IS NOT NULL AND t.review_id = p_review_id)
     OR (p_review_id IS NULL AND t.image_next_check_at <= now()
         AND NOT EXISTS (SELECT 1 FROM public.review_images ri WHERE ri.review_id = t.review_id AND ri.source_kind = 'product'))
  ORDER BY t.image_next_check_at ASC, t.review_id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 3), 10));
$$;
REVOKE ALL ON FUNCTION public.get_review_image_targets(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_image_targets(integer, text) TO service_role;

-- p_candidates: [{image_url, alt, source_page_url, source_kind, source_label, via, match_confidence}]
CREATE OR REPLACE FUNCTION public.save_review_image_candidates(p_review_id text, p_tool text, p_candidates jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c jsonb; v_inserted int := 0; v_seen int := 0;
BEGIN
  IF p_tool NOT IN ('parallel_search', 'nimble') THEN RAISE EXCEPTION 'bad tool'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.review_price_targets WHERE review_id = p_review_id) THEN RAISE EXCEPTION 'unknown review %', p_review_id; END IF;
  FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(p_candidates, '[]'::jsonb)) LOOP
    IF COALESCE(c->>'image_url', '') !~ '^https://' THEN CONTINUE; END IF;
    v_seen := v_seen + 1;
    INSERT INTO public.review_image_candidates (review_id, image_url, alt, source_page_url, source_kind, source_label, via, match_confidence, tool)
    VALUES (p_review_id, c->>'image_url', left(c->>'alt', 300), c->>'source_page_url', c->>'source_kind', left(c->>'source_label', 80),
            c->>'via', NULLIF(c->>'match_confidence', '')::numeric, p_tool)
    ON CONFLICT (review_id, image_url) DO NOTHING;
    IF FOUND THEN v_inserted := v_inserted + 1; END IF;
  END LOOP;
  UPDATE public.review_price_targets
     SET image_checked_at = now(), image_found = v_seen,
         image_next_check_at = now() + CASE WHEN v_seen > 0 THEN interval '90 days' ELSE interval '7 days' END
   WHERE review_id = p_review_id;
  RETURN jsonb_build_object('found', v_seen, 'inserted', v_inserted);
END;
$$;
REVOKE ALL ON FUNCTION public.save_review_image_candidates(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_review_image_candidates(text, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.defer_review_image_check(p_review_id text, p_hours integer DEFAULT 6)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.review_price_targets SET image_next_check_at = now() + make_interval(hours => GREATEST(1, LEAST(COALESCE(p_hours, 6), 72))) WHERE review_id = p_review_id;
$$;
REVOKE ALL ON FUNCTION public.defer_review_image_check(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.defer_review_image_check(text, integer) TO service_role;

-- ---------- admin verification: the only path to a published real image ----------
CREATE OR REPLACE FUNCTION public.admin_decide_review_images(p_ids uuid[], p_decision text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_n integer := 0;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'bad decision'; END IF;
  IF p_decision = 'approved' AND (SELECT count(DISTINCT review_id) FROM public.review_image_candidates WHERE id = ANY (p_ids)) <> COALESCE(array_length(p_ids, 1), 0) THEN
    RAISE EXCEPTION 'approve one image per review at a time';
  END IF;

  FOR r IN SELECT * FROM public.review_image_candidates WHERE id = ANY (p_ids) LOOP
    IF p_decision = 'approved' THEN
      -- one real cover per review: any earlier approval is superseded
      UPDATE public.review_image_candidates SET status = 'superseded' WHERE review_id = r.review_id AND status = 'approved' AND id <> r.id;
      UPDATE public.review_image_candidates SET status = 'approved', verified_by = (SELECT auth.uid()), verified_at = now() WHERE id = r.id;
      INSERT INTO public.review_images (review_id, image_url, alt, credit_name, credit_url, source_kind, source_page_url, verified_by, verified_at)
      VALUES (r.review_id, r.image_url, COALESCE(NULLIF(r.alt, ''), 'Product image'), r.source_label, r.source_page_url, 'product', r.source_page_url, (SELECT auth.uid()), now())
      ON CONFLICT (review_id) DO UPDATE SET image_url = EXCLUDED.image_url, alt = EXCLUDED.alt, credit_name = EXCLUDED.credit_name,
        credit_url = EXCLUDED.credit_url, source_kind = 'product', source_page_url = EXCLUDED.source_page_url, verified_by = EXCLUDED.verified_by, verified_at = EXCLUDED.verified_at;
      UPDATE public.ai_generated_product_reviews SET primary_image = r.image_url WHERE id = r.review_id;
    ELSE
      UPDATE public.review_image_candidates SET status = 'rejected', verified_by = (SELECT auth.uid()), verified_at = now() WHERE id = r.id;
      -- rejecting the image that is currently published takes the cover down (the stock photo shows again)
      DELETE FROM public.review_images WHERE review_id = r.review_id AND source_kind = 'product' AND image_url = r.image_url;
      UPDATE public.ai_generated_product_reviews SET primary_image = NULL WHERE id = r.review_id AND primary_image = r.image_url;
    END IF;
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_decide_review_images(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decide_review_images(uuid[], text) TO authenticated, service_role;
