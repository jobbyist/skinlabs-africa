-- The catalog transcription of this product's FTN URL dropped a hyphen
-- ("vitamin-cturmeric"), so openhaus-price-sync got a 404 for it. The seed
-- migration's upsert doesn't touch source_url on conflict, so correct the
-- row directly (src/data/marketplace/ftn-catalog.ts is fixed too).
UPDATE public.marketplace_products
SET source_url = 'https://www.faithful-to-nature.co.za/lelive-all-glow-d-up-ha-brightening-serum-vitamin-c-turmeric'
WHERE source_url = 'https://www.faithful-to-nature.co.za/lelive-all-glow-d-up-ha-brightening-serum-vitamin-cturmeric';
