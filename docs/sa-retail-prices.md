# SA retail prices ("where to buy in South Africa")

Growth-engine wedge: real, dated South African prices from Clicks, Dis-Chem and Takealot,
read from each retailer's own product page. Principle: **a price is shown only if the page
was read, the product was matched with confidence, and it was checked recently.** Otherwise
nothing is shown. (Before this, review pages showed hard-coded editorial prices marked "In
stock" that nobody had ever checked.)

## Data flow

```
Firecrawl web search (site:retailer)  ->  rankSearchResults()  ->  best candidate page read (Firecrawl scrape, rawHtml)
      -> parseListing() (deterministic price) -> scoreMatch()/confirmWithPage() -> save_listing_candidate()
            matched      -> price recorded now (record_price_observation) -> public
            needs_review -> admin queue (Admin > SA Prices)               -> private until approved
            miss         -> stamped, retried after 30 days
refresh (daily): matched listings -> page read -> parseListing() -> evaluateObservation() -> record_price_observation()
```

All decisions are in the pure, tested library `supabase/functions/_shared/pricing/`
(`bun test supabase/functions/_shared/pricing`, 36 tests incl. real retailer markup and real
search results). The edge function `retailer-price-sync` is I/O only.

## Rules baked in

- **robots.txt (read 2026-10-03)**: Clicks allows product pages but asks for a **10 s crawl delay** and visits only
  **04:00-08:45 UTC**; Dis-Chem allows plain product URLs, forbids anything with a query string (so
  `?srsltid=` etc. are stripped), and blocks named AI crawlers; Takealot allows PLID pages. Encoded in
  `_shared/pricing/retailers.ts`. Re-check when fetching fails or a retailer is added.
- Never solve or bypass a bot challenge: a page that can't be read is a failure, not something to work around.
- **No model reads prices.** Clicks: schema.org JSON-LD offer. Dis-Chem: `itemprop`/`product:price` meta. Takealot: the
  buy-box block only (the page also lists recommended products' prices). Anything ambiguous -> null.
- **Matcher** (`match.ts`): every brand word must appear (title, or the brand tag in the retailer's snippet);
  product-name words incl. strengths ("10%") must be covered; a size mismatch rejects; **no variant has a pack size
  today (0 of 160)**, so an unsized product is auto-matched only when exactly one plausible listing exists and the name
  fits tightly - otherwise a person decides. Prices are only compared within one pack size in the UI.
- **Sanity** (`sanity.ts`): price must be R1-R50,000; a move over 50% needs the same reading twice; unchanged prices are
  re-recorded at most every 30 days; history in `product_prices` is append-only.
- **Freshness**: the public view `sa_retail_prices` hides a listing not checked for 14 days or whose last 2 checks failed.
  5 failures in a row hand the listing back to review.
- **Firecrawl free-tier limits** (`_shared/pricing/budget.ts`, tested): the free plan is a small ONE-TIME credit allowance,
  so every run (a) reads the account's real remaining credits (`/v2/team/credit-usage`), (b) keeps a reserve of 150
  (`RETAILER_PRICE_CREDIT_RESERVE`) for briefings/reviews that share the account, (c) honours a daily cap of 30 credits
  (`RETAILER_PRICE_DAILY_CREDIT_BUDGET`; search 2, page read 1, counted from `pipeline_api_usage`), and (d) spends at most
  what's left of both. If the balance can't be read it does nothing. Requests are sequential, one retailer at a time. Any
  401/402/403/429 stops the run (`blocked_firecrawl`, reason in `retailer_price_runs.summary.stop_detail`). Raise the caps
  only after upgrading the Firecrawl plan.
- **Takealot is paused** (owner decision, 2026-10-03): `DISABLED_RETAILERS` in `retailers.ts`, no cron jobs, and the function
  refuses it. Existing Takealot rows stay but age out of the public view after 14 days. To resume: empty that list, re-add
  the two jobs.

## Schema (migration `20261003120000_retailer_price_pipeline.sql`, applied live)

Reuses `retailers`, `retailer_products`, `product_prices`. Adds match tracking to `retailer_products`
(`match_status` unmatched|matched|needs_review|rejected, confidence, reasons, listing title/size, failure counters),
`product_prices.in_stock`, `retailer_price_runs`, service-role RPCs, and the public view `sa_retail_prices`.
**Public read of `retailer_products`/`product_prices` is narrowed to live-observed rows** (`match_status = 'matched'` /
`source_type = 'retailer_listing'`): the 241 pre-existing rows were editorial seeds (homepage URLs, never checked) and are
no longer served to the public API (admins still see them). The migration uses no `DROP` (the Supabase SQL tool hangs on it).

## What visitors see

`SaPricesPanel` on review pages (SPA `ProductReview` and the SSR `/reviews/:slug` route): live rows grouped by pack size,
cheapest first, "checked today / yesterday / N days ago", explicit "Out of stock" only when the page says so, a Takealot
third-party-seller note, and "read automatically ... check the retailer" framing. **With no live rows, a dated
review-time snapshot is shown only for reviews that kept a real product-page URL and a publish date** (worded "not live");
static-catalogue prices (homepage links, no date) are no longer shown. JSON-LD `offers` and the At-a-Glance price come from
live rows only.

## Operating it

- Auth: `x-cron-secret`, verified in the database against Vault `retailer_price_sync_cron_secret` (no Edge secret to set).
- Firecrawl key: `FIRECRAWL_API_KEY_PRICES`, else `FIRECRAWL_API_KEY`, else `FIRECRAWL_API_KEY_BRIEFINGS`.
- Manual run (secret never leaves the DB):
  `select net.http_post(url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/retailer-price-sync', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='retailer_price_sync_cron_secret')), body := '{"retailer":"takealot","mode":"discover","limit":8,"wait":true}'::jsonb, timeout_milliseconds := 150000);`
  then read `retailer_price_runs`. **Run one retailer at a time** (Firecrawl concurrency limit -> 429).
- Review queue: Admin > SA Prices (approve = public, price recorded on the next refresh; reject = never shown).
- Pause: `select cron.unschedule('<job name>')`. Rollback of display: the old behaviour is not restorable by config (by design).

## Known limits / next

- Takealot may list one product from several third-party sellers (different PLIDs); the first plausible one is used.
- A refreshed page is not re-matched against the stored title yet (a retailer reusing a URL for another product would be
  caught only by the price-swing rule). Worth adding.
- Only Clicks/Dis-Chem/Takealot are wired. Google Shopping needs a licensed API (scraping it is against Google's terms).
- Product variants have no pack size; backfilling `product_variants.size_ml` would let far more matches auto-approve safely.
- Aggregators/OpenHaus prices are separate and untouched.

## Schedules (migration `20261003130000_retailer_price_cron.sql`, applied live)

| Job | UTC | Notes |
|-----|-----|-------|
| `retailer-price-refresh-clicks` | `*/15 4-7` | inside Clicks' visit window; 6 pages/run, 10 s apart |
| `retailer-price-discover-clicks` | `10 8` | inside the window; 2 products/run |
| `retailer-price-refresh-dischem` | `0,20,40 2-3` | 8 listings/run |
| `retailer-price-discover-dischem` | `30 11` | 3 products/run |

(Takealot jobs removed; everything is further bounded by the credit allowance above.)

Each job posts with `wait` off (the function answers 202 and works in the background). Clicks has only been exercised
by unit tests on real markup so far; confirm the first morning run in `retailer_price_runs`.


## Update 2026-10-03: no-Firecrawl price paths

- **Clicks refresh is a plain HTTP read** (`directFetch`): identified User-Agent (`SkinLabsPriceBot/1.0`), the same crawl delay and
  04:00-08:45 UTC window, no credits. Clicks' plain response builds its Product JSON-LD in an inline script (not an ld+json block), so
  `parseClicks` falls back to reading that Offer block (fixture `clicks-inline-script-niacinamide-30ml.html`). A bot challenge stops
  the run (`retailer_challenge`, status `error`) and is never bypassed.
- **Dis-Chem and Faithful to Nature** serve a Cloudflare challenge to plain requests; **Takealot**'s plain response is a client-rendered
  shell without the buy-box. Those stay Firecrawl-only (Takealot paused) or have no live price.
- **OpenHaus products** (59 of the 65 generated reviews): the price is first-party and fresh (`openhaus-price-sync`, daily), exposed per
  review by `review_live_prices` and copied into `local_price_zar` daily by `sync_openhaus_review_prices()`.


## Update 2026-10-08: review prices via Parallel Search (Nimble fallback), verified by a person, re-checked every 25 days

Replaces Firecrawl for **published product reviews** (static catalogue, AI-generated and Sponsored/OpenHaus): real prices from
Takealot, Dis-Chem, Clicks, Dermastore, SkinMiles and Faithful to Nature.

```
review_price_targets (one per review; trigger adds new generated reviews, static ones seeded by scripts/generate-review-price-targets.ts)
  -> cron `review-price-sync` every 10 min, only when a target is due  -> edge function review-price-sync (4 reviews / run)
  -> ONE Parallel Search call per review (6 site queries, include_domains = the six shops, 1500 chars/result)
       unavailable (no key / 401 / 402 / 403 / 429 / 5xx)  ->  Nimble Search (include_domains, fast depth)
  -> _shared/pricing/reviewPrices.ts: product-page URLs only + strict matcher (match.ts) + deterministic price read (no model reads prices)
  -> save_review_price_check()  ->  review_price_listings.status = pending   (NOT public)
  -> Admin > SA Prices > "Review prices": approve / reject / correct price  (admin_decide_review_prices)
  -> approved + checked <= 30 days  ->  view sa_retail_prices  ->  existing SaPricesPanel, JSON-LD offers, At-a-Glance (no frontend change)
```

- **Nothing is public until approved.** The public RLS policy / view serve `status = 'approved'` AND `checked_at >= now() - 30 days`, so a price
  that is not re-verified simply disappears at 30 days. Targets are re-checked every **25 days** (a gap-free margin); a review with nothing found
  retries after 7 days. A deferred (provider down) target retries in 6 h.
- **Re-check keeps the person's verification of the LISTING**: an approved listing whose price moves <= 50% refreshes itself (history row
  appended); a bigger move goes back to `pending` (hidden) for a person. A rejected listing is never re-proposed.
- **Dis-Chem "Special Price"** (10-20% member discounts) is stored as `special_price_zar` and NOT shown; the list price is the price.
- **Future review generation is priced automatically**: the trigger `trg_review_price_target_generated` on `ai_generated_product_reviews` makes
  every new review a due target, so `product-review-sync` (and anything else that inserts reviews) needs no changes. New *static* reviews:
  re-run `scripts/generate-review-price-targets.ts` and apply the emitted SQL (idempotent).
- **Provider order / limits**: Parallel first. The Parallel *MCP* free tier rate-limited 3 of 6 concurrent calls in the first session run, which is
  exactly the case the Nimble fallback covers (verified: Nimble returned usable listings). The edge function uses the REST API with its own key.
- **Secrets a human must set (Supabase Edge Function secrets)**: `PARALLEL_API_KEY` (required) and `NIMBLE_API_KEY` (fallback). Until
  `PARALLEL_API_KEY` or `NIMBLE_API_KEY` exists the function answers 503 `blocked_not_configured` *before claiming anything* and the targets stay due.
  Cron auth needs no secret (Vault `review_price_sync_cron_secret`, verified in the database).
- **Firecrawl retired for reviews**: cron jobs `retailer-price-discover-clicks`, `retailer-price-refresh-dischem`, `retailer-price-discover-dischem`
  were unscheduled (re-add from `20261003130000_retailer_price_cron.sql`). `retailer-price-refresh-clicks` (direct fetch, no credits) stays.
- **Manual run** (secret never leaves the DB):
  `select net.http_post(url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/review-price-sync', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='review_price_sync_cron_secret')), body := '{"limit":2,"wait":true}'::jsonb, timeout_milliseconds := 120000);`
  or "Check 3 reviews now" in the admin panel; one review: `{"review_id":"<id>","wait":true}`. Runs are logged in `review_price_runs`.
- **Known limits**: many SA-brand products (Lelive, SKOON, Standard Beauty, Esse) are mainly sold by Faithful to Nature and the brands' own shops
  (not among the six), so coverage per review will often be 1-2 shops. Category/brand pages and aggregator results are ignored by design. Dermastore,
  SkinMiles and FTN product-page URL shapes are matched by "single slug, not a known category word" plus the title matcher and a readable price;
  tune `productPath` in `reviewPrices.ts` if a shop's URL scheme proves different. Probe: `supabase/tests/review_price_verification.sql` (9 checks, rolled back).
