-- FTN's regular (non-sale) price as last seen by openhaus-price-sync. Our
-- price is held steady while this is unchanged, so an FTN sale starting or
-- ending doesn't move it; a change here (a real FTN price change) reprices.
-- NULL until the product's first sync after this migration, which records
-- it and prices from FTN's current selling price.
ALTER TABLE public.marketplace_products
  ADD COLUMN IF NOT EXISTS source_regular_price_zar numeric;
