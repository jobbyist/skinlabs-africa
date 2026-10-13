-- review-image-sync: finds and validates real product images for every review (candidates are pending until approved in
-- Admin > Data Quality). Calls the function only when a review is due and no run is in flight. Auth via the Vault secret
-- shared with review-price-sync. Image runs are logged in review_price_runs with source = 'image'.
SELECT cron.schedule(
  'review-image-sync',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/review-image-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'review_price_sync_cron_secret')),
    body := '{"limit":3}'::jsonb,
    timeout_milliseconds := 5000
  )
  WHERE EXISTS (SELECT 1 FROM public.review_price_targets t WHERE t.image_next_check_at <= now()
                AND NOT EXISTS (SELECT 1 FROM public.review_images ri WHERE ri.review_id = t.review_id AND ri.source_kind = 'product'))
    AND NOT EXISTS (SELECT 1 FROM public.review_price_runs WHERE source = 'image' AND status = 'running' AND started_at > now() - interval '3 minutes');
  $$
);
