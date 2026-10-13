# Review cover images (real product images)

Every published review's cover is meant to be the product's own image, taken from the brand's website and/or a retailer page we price,
verified by a person. Stock (Unsplash/Pexels) photos remain only as the fallback until a real image is approved.

```
review_price_targets (every review; trigger adds new generated reviews)  --image_next_check_at-->
  cron review-image-sync (*/10, only when due; catch-up job */3 while backfilling) -> edge function review-image-sync
    pages: known price-listing URLs (brand site first) + Parallel Search (default) / Nimble Search (fallback) for reviews with <2 pages
    page HTML: brand sites by a plain polite request; retailers via Nimble Extract (several sit behind bot challenges; never bypassed)
    image: og:image / twitter:image / JSON-LD Product.image / link rel=image_src / the page's primary product <img> (Clicks)
    validate: https, image content-type, not tiny -> review_image_candidates.status = pending
  Admin > Data Quality > "Review cover images": "Use as cover" / Reject / bulk-approve best brand image
    admin_decide_review_images() -> review_images (source_kind = 'product', credit = source, source_page_url) + ai_generated_product_reviews.primary_image
  Site: ReviewsGrid / LatestReviews cards (useProductCoverImages), review page + SSR route (product image beats brand banner and stock), caption "Product image from <source>".
```

- Nothing is public until approved. One live image per review; approving another supersedes the first; rejecting the live one restores the stock cover.
- Re-search every 90 days when found, 7 days when nothing was found. A review with an approved product image is skipped.
- Future reviews: `product-review-sync` no longer fetches a Pexels photo; it nudges `review-image-sync` after publishing and never overwrites a
  verified product image (banner/stock writes are skipped when one exists). The page shows its category photo until the image is approved.
- Images are hotlinked from the source (`referrerPolicy=no-referrer`, attribution caption). Rights belong to the brand/retailer: get permission or
  re-host with consent before relying on them commercially. Shops that block hotlinking show a broken preview in the admin panel (it says so) and
  should be rejected.
- Pure code + tests: `supabase/functions/_shared/pricing/reviewImages.ts` (`bun test supabase/functions/_shared/pricing`).
- Runs are logged in `review_price_runs` with `source = 'image'`; `summary.diag` shows pages tried, HTML sizes and images kept per review.
