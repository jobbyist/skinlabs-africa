-- Email automations, sent by the existing outbox -> email-processor -> Resend pipeline.
-- daily briefing + weekly top brands are opt-in MARKETING jobs; the welcome series
-- (MEMBERSHIP) and weekly reminder (ROUTINES) go to EVERY member except those who
-- explicitly unsubscribed (consent false AND marketing_consent_at set):
--   daily_briefing_digest     daily  05:30 UTC (07:30 SAST), after briefings-sync (04:00 UTC)
--   weekly_top_brands         Friday 07:00 UTC
--   welcome_series_1..4       daily  06:00 UTC, on days 1, 3, 5 and 8 after sign-up
--   weekly_analysis_reminder  daily  07:00 UTC, Glow Explorer / Glow Lite after their first Basic analysis
-- Content is real data only; each function returns 0 and enqueues nothing when
-- there is nothing real to send. The email-processor re-checks consent at send
-- time for every MARKETING job. Rollback: SELECT cron.unschedule(...) for the
-- four job names below and DROP FUNCTION for the five functions.

CREATE OR REPLACE FUNCTION public.marketing_unsubscribe_url(p_token uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=' || p_token::text;
$$;

-- ---------------------------------------------------------------- daily briefings
CREATE OR REPLACE FUNCTION public.enqueue_daily_briefing_email()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
  v_briefings jsonb;
  v_count integer := 0;
  v_rec record;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('title', title, 'slug', slug, 'excerpt', left(coalesce(excerpt, ''), 220))
                   ORDER BY coalesce(view_count, 0) DESC, created_at DESC)
    INTO v_briefings
    FROM (
      SELECT title, slug, excerpt, view_count, created_at
        FROM public.news_articles
       WHERE status = 'published' AND publish_date = v_today AND slug IS NOT NULL
       ORDER BY coalesce(view_count, 0) DESC, created_at DESC
       LIMIT 3
    ) t;

  IF v_briefings IS NULL THEN
    RETURN 0;  -- nothing published today: never send yesterday's news as today's
  END IF;

  FOR v_rec IN
    SELECT p.user_id, u.email, p.marketing_unsubscribe_token
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE p.marketing_consent = true
       AND coalesce(p.account_status, 'active') = 'active'
       AND u.email IS NOT NULL AND u.email_confirmed_at IS NOT NULL
  LOOP
    PERFORM public.enqueue_email(
      'DAILY_BRIEFING_DIGEST', 'daily_briefing:' || v_today::text || ':' || v_rec.user_id::text,
      'daily_briefing_digest', 'MARKETING', v_rec.user_id, v_rec.email,
      jsonb_build_object('briefings', v_briefings, 'date', v_today::text,
                         'unsubscribe_url', public.marketing_unsubscribe_url(v_rec.marketing_unsubscribe_token)),
      'cron:enqueue_daily_briefing_email', false
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- --------------------------------------------------------------- weekly top brands
-- One product category per week (rotating), top 3 brands by average SkinLabs
-- review score from the NON-sponsored editorial catalogue. The catalogue lives
-- in code (src/data/reviews.ts), so the rotation is generated into this table
-- by scripts/generate-weekly-featured-brands.ts; the function skips the send
-- when there is no row for the week, so an exhausted table fails quiet, not wrong.
CREATE TABLE IF NOT EXISTS public.weekly_featured_brands (
  week_label text NOT NULL,
  theme text NOT NULL,
  rank smallint NOT NULL CHECK (rank BETWEEN 1 AND 3),
  brand text NOT NULL,
  avg_score numeric(3,1) NOT NULL,
  review_count integer NOT NULL,
  top_product text,
  top_product_id text,
  PRIMARY KEY (week_label, rank)
);
ALTER TABLE public.weekly_featured_brands ENABLE ROW LEVEL SECURITY;  -- no policies: service role only
REVOKE ALL ON public.weekly_featured_brands FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_weekly_top_brands_email()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_week text := to_char(now() AT TIME ZONE 'Africa/Johannesburg', 'IYYY-"W"IW');
  v_theme text;
  v_brands jsonb;
  v_count integer := 0;
  v_rec record;
BEGIN
  SELECT max(theme),
         jsonb_agg(jsonb_build_object('brand', brand, 'avg_score', avg_score, 'review_count', review_count,
                                      'top_product', top_product, 'top_product_id', top_product_id) ORDER BY rank)
    INTO v_theme, v_brands
    FROM public.weekly_featured_brands WHERE week_label = v_week;

  IF v_brands IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_rec IN
    SELECT p.user_id, u.email, p.marketing_unsubscribe_token
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE p.marketing_consent = true
       AND coalesce(p.account_status, 'active') = 'active'
       AND u.email IS NOT NULL AND u.email_confirmed_at IS NOT NULL
  LOOP
    PERFORM public.enqueue_email(
      'WEEKLY_TOP_BRANDS', 'weekly_top_brands:' || v_week || ':' || v_rec.user_id::text,
      'weekly_top_brands', 'MARKETING', v_rec.user_id, v_rec.email,
      jsonb_build_object('brands', v_brands, 'theme', v_theme, 'week_label', v_week,
                         'unsubscribe_url', public.marketing_unsubscribe_url(v_rec.marketing_unsubscribe_token)),
      'cron:enqueue_weekly_top_brands_email', false
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ------------------------------------------------------------------ welcome series
-- Evergreen emails 1-4 on days 1, 3, 5 and 8 (SAST calendar days) after
-- sign-up. The transactional auth_welcome already covers day 0.
CREATE OR REPLACE FUNCTION public.enqueue_welcome_series_emails(p_today date DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date := coalesce(p_today, (now() AT TIME ZONE 'Africa/Johannesburg')::date);
  v_count integer := 0;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.user_id, u.email, p.marketing_unsubscribe_token,
           CASE v_today - (u.created_at AT TIME ZONE 'Africa/Johannesburg')::date
             WHEN 1 THEN 1 WHEN 3 THEN 2 WHEN 5 THEN 3 WHEN 8 THEN 4
           END AS step
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE (p.marketing_consent OR p.marketing_consent_at IS NULL)
       AND coalesce(p.account_status, 'active') = 'active'
       AND u.email IS NOT NULL AND u.email_confirmed_at IS NOT NULL
       AND (v_today - (u.created_at AT TIME ZONE 'Africa/Johannesburg')::date) IN (1, 3, 5, 8)
  LOOP
    PERFORM public.enqueue_email(
      'WELCOME_SERIES', 'welcome_series:' || v_rec.step::text || ':' || v_rec.user_id::text,
      'welcome_series_' || v_rec.step::text, 'MEMBERSHIP', v_rec.user_id, v_rec.email,
      jsonb_build_object('step', v_rec.step,
                         'unsubscribe_url', public.marketing_unsubscribe_url(v_rec.marketing_unsubscribe_token)),
      'cron:enqueue_welcome_series_emails', false
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ------------------------------------------- weekly free Basic analysis reminder
-- Glow Explorer / Glow Lite members who have taken their first free Basic
-- analysis get one reminder each time the next free analysis unlocks (the
-- rolling window is pricing_settings.free_analysis_window_days, 7 by default).
-- At most one per 6 days, and at most 4 unanswered reminders per analysis, so
-- someone who has gone quiet isn't mailed forever.
CREATE OR REPLACE FUNCTION public.enqueue_weekly_analysis_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window integer;
  v_week text := to_char(now() AT TIME ZONE 'Africa/Johannesburg', 'IYYY-"W"IW');
  v_count integer := 0;
  v_rec record;
BEGIN
  SELECT coalesce(s.free_analysis_window_days, 7) INTO v_window
    FROM public.pricing_settings s WHERE s.variant_key = 'control';
  v_window := coalesce(v_window, 7);

  FOR v_rec IN
    SELECT p.user_id, u.email, p.marketing_unsubscribe_token
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
     WHERE (p.marketing_consent OR p.marketing_consent_at IS NULL)
       AND coalesce(p.account_status, 'active') = 'active'
       AND u.email IS NOT NULL AND u.email_confirmed_at IS NOT NULL
       AND p.last_free_analysis_at IS NOT NULL
       AND p.last_free_analysis_at + make_interval(days => v_window) <= now()
       AND public.formulator_tier(p.user_id) IN ('explorer', 'glow_lite')
       AND NOT EXISTS (
         SELECT 1 FROM public.email_outbox o
          WHERE o.user_id = p.user_id AND o.template_id = 'weekly_analysis_reminder'
            AND o.created_at > now() - interval '6 days')
       AND (SELECT count(*) FROM public.email_outbox o
             WHERE o.user_id = p.user_id AND o.template_id = 'weekly_analysis_reminder'
               AND o.created_at > p.last_free_analysis_at) < 4
  LOOP
    PERFORM public.enqueue_email(
      'WEEKLY_ANALYSIS_REMINDER', 'weekly_analysis_reminder:' || v_week || ':' || v_rec.user_id::text,
      'weekly_analysis_reminder', 'ROUTINES', v_rec.user_id, v_rec.email,
      jsonb_build_object('week_label', v_week,
                         'unsubscribe_url', public.marketing_unsubscribe_url(v_rec.marketing_unsubscribe_token)),
      'cron:enqueue_weekly_analysis_reminders', false
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_daily_briefing_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_weekly_top_brands_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_welcome_series_emails(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_weekly_analysis_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.marketing_unsubscribe_url(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_daily_briefing_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_weekly_top_brands_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_welcome_series_emails(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_weekly_analysis_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.marketing_unsubscribe_url(uuid) TO service_role;

-- Generated by scripts/generate-weekly-featured-brands.ts (20 weeks from 2026-10-05).
INSERT INTO public.weekly_featured_brands (week_label, theme, rank, brand, avg_score, review_count, top_product, top_product_id) VALUES
  ('2026-W41', 'serum', 1, 'Fundamentals', 8.4, 2, '6% Niacinamide Serum', 'fundamentals-niacinamide-6'),
  ('2026-W41', 'serum', 2, 'Skin Functional', 8.1, 6, '10% Niacinamide + NAG + Succinic + Zinc', 'sf-niacinamide-nag-succinic'),
  ('2026-W41', 'serum', 3, 'Lamelle', 7.8, 1, 'Correctives Brite-Lite / Brighter Serum', 'lamelle-correctives-brighter-serum'),
  ('2026-W42', 'moisturiser', 1, 'Standard Beauty', 8.2, 3, 'CERious PrOATection Moisturiser', 'sb-cerious-proatection'),
  ('2026-W42', 'moisturiser', 2, 'Lamelle', 8.1, 1, 'Serra Restore Cream', 'lamelle-serra-restore-cream'),
  ('2026-W42', 'moisturiser', 3, 'Environ', 8.0, 1, 'Skin EssentiA AVST Moisturiser', 'environ-essentia-avst-moisturiser'),
  ('2026-W43', 'cleanser', 1, 'Bioderma', 8.0, 2, 'Sensibio H2O Micellar Water', 'bioderma-sensibio-h2o'),
  ('2026-W43', 'cleanser', 2, 'Standard Beauty', 7.7, 2, 'Salicylic Acid Face Wash', 'sb-salicylic-face-wash'),
  ('2026-W43', 'cleanser', 3, 'Skin Functional', 7.6, 1, 'Salicylic Cleansing Gel', 'sf-salicylic-cleansing-gel'),
  ('2026-W44', 'sunscreen', 1, 'CF Suncare', 8.0, 2, 'Everyday SPF50 Sunscreen', 'cfs-everyday-spf50'),
  ('2026-W44', 'sunscreen', 2, 'Dermopal', 8.0, 1, 'Tinted Sunscreen for Deeper Skin Tones', 'dp-tinted-spf-deeper-tones'),
  ('2026-W44', 'sunscreen', 3, 'Skin Functional', 8.0, 1, 'Chemical & Mineral SPF50', 'sf-spf50-hybrid'),
  ('2026-W45', 'body care', 1, 'Hassteon Organix', 7.5, 1, 'Shea & Marula Body Butter', 'ho-shea-marula-butter'),
  ('2026-W45', 'body care', 2, 'Africology', 7.4, 1, 'Rooibos & Marula Body Butter', 'af-rooibos-marula-butter'),
  ('2026-W45', 'body care', 3, 'Bio-Oil', 7.0, 5, 'Bio-Oil Skincare Oil 125ml', 'biooil-original-125ml'),
  ('2026-W46', 'serum', 1, 'Fundamentals', 8.4, 2, '6% Niacinamide Serum', 'fundamentals-niacinamide-6'),
  ('2026-W46', 'serum', 2, 'Skin Functional', 8.1, 6, '10% Niacinamide + NAG + Succinic + Zinc', 'sf-niacinamide-nag-succinic'),
  ('2026-W46', 'serum', 3, 'Lamelle', 7.8, 1, 'Correctives Brite-Lite / Brighter Serum', 'lamelle-correctives-brighter-serum'),
  ('2026-W47', 'moisturiser', 1, 'Standard Beauty', 8.2, 3, 'CERious PrOATection Moisturiser', 'sb-cerious-proatection'),
  ('2026-W47', 'moisturiser', 2, 'Lamelle', 8.1, 1, 'Serra Restore Cream', 'lamelle-serra-restore-cream'),
  ('2026-W47', 'moisturiser', 3, 'Environ', 8.0, 1, 'Skin EssentiA AVST Moisturiser', 'environ-essentia-avst-moisturiser'),
  ('2026-W48', 'cleanser', 1, 'Bioderma', 8.0, 2, 'Sensibio H2O Micellar Water', 'bioderma-sensibio-h2o'),
  ('2026-W48', 'cleanser', 2, 'Standard Beauty', 7.7, 2, 'Salicylic Acid Face Wash', 'sb-salicylic-face-wash'),
  ('2026-W48', 'cleanser', 3, 'Skin Functional', 7.6, 1, 'Salicylic Cleansing Gel', 'sf-salicylic-cleansing-gel'),
  ('2026-W49', 'sunscreen', 1, 'CF Suncare', 8.0, 2, 'Everyday SPF50 Sunscreen', 'cfs-everyday-spf50'),
  ('2026-W49', 'sunscreen', 2, 'Dermopal', 8.0, 1, 'Tinted Sunscreen for Deeper Skin Tones', 'dp-tinted-spf-deeper-tones'),
  ('2026-W49', 'sunscreen', 3, 'Skin Functional', 8.0, 1, 'Chemical & Mineral SPF50', 'sf-spf50-hybrid'),
  ('2026-W50', 'body care', 1, 'Hassteon Organix', 7.5, 1, 'Shea & Marula Body Butter', 'ho-shea-marula-butter'),
  ('2026-W50', 'body care', 2, 'Africology', 7.4, 1, 'Rooibos & Marula Body Butter', 'af-rooibos-marula-butter'),
  ('2026-W50', 'body care', 3, 'Bio-Oil', 7.0, 5, 'Bio-Oil Skincare Oil 125ml', 'biooil-original-125ml'),
  ('2026-W51', 'serum', 1, 'Fundamentals', 8.4, 2, '6% Niacinamide Serum', 'fundamentals-niacinamide-6'),
  ('2026-W51', 'serum', 2, 'Skin Functional', 8.1, 6, '10% Niacinamide + NAG + Succinic + Zinc', 'sf-niacinamide-nag-succinic'),
  ('2026-W51', 'serum', 3, 'Lamelle', 7.8, 1, 'Correctives Brite-Lite / Brighter Serum', 'lamelle-correctives-brighter-serum'),
  ('2026-W52', 'moisturiser', 1, 'Standard Beauty', 8.2, 3, 'CERious PrOATection Moisturiser', 'sb-cerious-proatection'),
  ('2026-W52', 'moisturiser', 2, 'Lamelle', 8.1, 1, 'Serra Restore Cream', 'lamelle-serra-restore-cream'),
  ('2026-W52', 'moisturiser', 3, 'Environ', 8.0, 1, 'Skin EssentiA AVST Moisturiser', 'environ-essentia-avst-moisturiser'),
  ('2026-W53', 'cleanser', 1, 'Bioderma', 8.0, 2, 'Sensibio H2O Micellar Water', 'bioderma-sensibio-h2o'),
  ('2026-W53', 'cleanser', 2, 'Standard Beauty', 7.7, 2, 'Salicylic Acid Face Wash', 'sb-salicylic-face-wash'),
  ('2026-W53', 'cleanser', 3, 'Skin Functional', 7.6, 1, 'Salicylic Cleansing Gel', 'sf-salicylic-cleansing-gel'),
  ('2027-W01', 'sunscreen', 1, 'CF Suncare', 8.0, 2, 'Everyday SPF50 Sunscreen', 'cfs-everyday-spf50'),
  ('2027-W01', 'sunscreen', 2, 'Dermopal', 8.0, 1, 'Tinted Sunscreen for Deeper Skin Tones', 'dp-tinted-spf-deeper-tones'),
  ('2027-W01', 'sunscreen', 3, 'Skin Functional', 8.0, 1, 'Chemical & Mineral SPF50', 'sf-spf50-hybrid'),
  ('2027-W02', 'body care', 1, 'Hassteon Organix', 7.5, 1, 'Shea & Marula Body Butter', 'ho-shea-marula-butter'),
  ('2027-W02', 'body care', 2, 'Africology', 7.4, 1, 'Rooibos & Marula Body Butter', 'af-rooibos-marula-butter'),
  ('2027-W02', 'body care', 3, 'Bio-Oil', 7.0, 5, 'Bio-Oil Skincare Oil 125ml', 'biooil-original-125ml'),
  ('2027-W03', 'serum', 1, 'Fundamentals', 8.4, 2, '6% Niacinamide Serum', 'fundamentals-niacinamide-6'),
  ('2027-W03', 'serum', 2, 'Skin Functional', 8.1, 6, '10% Niacinamide + NAG + Succinic + Zinc', 'sf-niacinamide-nag-succinic'),
  ('2027-W03', 'serum', 3, 'Lamelle', 7.8, 1, 'Correctives Brite-Lite / Brighter Serum', 'lamelle-correctives-brighter-serum'),
  ('2027-W04', 'moisturiser', 1, 'Standard Beauty', 8.2, 3, 'CERious PrOATection Moisturiser', 'sb-cerious-proatection'),
  ('2027-W04', 'moisturiser', 2, 'Lamelle', 8.1, 1, 'Serra Restore Cream', 'lamelle-serra-restore-cream'),
  ('2027-W04', 'moisturiser', 3, 'Environ', 8.0, 1, 'Skin EssentiA AVST Moisturiser', 'environ-essentia-avst-moisturiser'),
  ('2027-W05', 'cleanser', 1, 'Bioderma', 8.0, 2, 'Sensibio H2O Micellar Water', 'bioderma-sensibio-h2o'),
  ('2027-W05', 'cleanser', 2, 'Standard Beauty', 7.7, 2, 'Salicylic Acid Face Wash', 'sb-salicylic-face-wash'),
  ('2027-W05', 'cleanser', 3, 'Skin Functional', 7.6, 1, 'Salicylic Cleansing Gel', 'sf-salicylic-cleansing-gel'),
  ('2027-W06', 'sunscreen', 1, 'CF Suncare', 8.0, 2, 'Everyday SPF50 Sunscreen', 'cfs-everyday-spf50'),
  ('2027-W06', 'sunscreen', 2, 'Dermopal', 8.0, 1, 'Tinted Sunscreen for Deeper Skin Tones', 'dp-tinted-spf-deeper-tones'),
  ('2027-W06', 'sunscreen', 3, 'Skin Functional', 8.0, 1, 'Chemical & Mineral SPF50', 'sf-spf50-hybrid'),
  ('2027-W07', 'body care', 1, 'Hassteon Organix', 7.5, 1, 'Shea & Marula Body Butter', 'ho-shea-marula-butter'),
  ('2027-W07', 'body care', 2, 'Africology', 7.4, 1, 'Rooibos & Marula Body Butter', 'af-rooibos-marula-butter'),
  ('2027-W07', 'body care', 3, 'Bio-Oil', 7.0, 5, 'Bio-Oil Skincare Oil 125ml', 'biooil-original-125ml')
ON CONFLICT (week_label, rank) DO UPDATE SET theme = EXCLUDED.theme, brand = EXCLUDED.brand, avg_score = EXCLUDED.avg_score,
  review_count = EXCLUDED.review_count, top_product = EXCLUDED.top_product, top_product_id = EXCLUDED.top_product_id;


-- ------------------------------------------------------------------------ schedules
DO $$
DECLARE
  j record;
BEGIN
  FOR j IN SELECT * FROM (VALUES
    ('daily-briefing-email',        '30 5 * * *', 'SELECT public.enqueue_daily_briefing_email()'),
    ('weekly-top-brands-email',     '0 7 * * 5',  'SELECT public.enqueue_weekly_top_brands_email()'),
    ('welcome-series-emails-daily', '0 6 * * *',  'SELECT public.enqueue_welcome_series_emails()'),
    ('weekly-analysis-reminders',   '0 7 * * *',  'SELECT public.enqueue_weekly_analysis_reminders()')
  ) AS t(name, schedule, command) LOOP
    PERFORM cron.unschedule(j.name) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = j.name);
    PERFORM cron.schedule(j.name, j.schedule, j.command);
  END LOOP;
END $$;
