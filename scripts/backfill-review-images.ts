/**
 * One-off backfill: gives every published product review (the ~160+ static
 * entries in src/data/reviews.ts, plus whatever's live in
 * ai_generated_product_reviews) a real, persisted cover photo in
 * public.review_images via the seed-review-images edge function -- Pexels
 * first, Unsplash fallback (see supabase/functions/seed-review-images/
 * index.ts). This is what src/hooks/use-review-images.ts's live client-side
 * Pexels/Unsplash fallback exists to cover today; once this backfill reaches
 * full coverage, that live-fetch branch (and the VITE_PEXELS_API_KEY/
 * VITE_UNSPLASH_ACCESS_KEY keys it needs client-side) can be removed.
 *
 * The edge function already skips any review_id that already has a row (pass
 * --force to re-roll every review's image instead), so this is safe to
 * re-run after new reviews are added -- e.g. once a day's worth of new
 * ai_generated_product_reviews rows land.
 *
 * Required environment variables (this script has no embedded credentials):
 *   SUPABASE_URL          Defaults to the real project URL if unset.
 *   SUPABASE_ANON_KEY     The publishable key (reads ai_generated_product_reviews).
 *   NEWS_CRON_SECRET       The same shared secret seed-review-images already
 *                           accepts via x-cron-secret (see that function's
 *                           header comment) -- ask whoever holds the
 *                           Supabase project secrets for this project.
 * A human must have already set PEXELS_API_KEY (and/or UNSPLASH_ACCESS_KEY)
 * as a Supabase Edge Function secret -- this script cannot set that itself.
 *
 * Run: bun run scripts/backfill-review-images.ts [--force]
 */

import { createClient } from "@supabase/supabase-js";
import { productReviews } from "../src/data/reviews";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://gnkpzijxuciiaamakgzm.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.NEWS_CRON_SECRET;
const FORCE = process.argv.includes("--force");
/** Keep each request well under the edge function's execution time limit. */
const BATCH_SIZE = 40;

if (!SUPABASE_ANON_KEY) {
  console.error("SUPABASE_ANON_KEY is required (the publishable key, to read ai_generated_product_reviews).");
  process.exit(1);
}
if (!CRON_SECRET) {
  console.error(
    "NEWS_CRON_SECRET is required -- the shared secret seed-review-images accepts via x-cron-secret. " +
      "Ask whoever holds this project's Supabase secrets for it.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ReviewRef {
  id: string;
  category: string;
}

async function collectAllReviews(): Promise<ReviewRef[]> {
  const staticRefs: ReviewRef[] = productReviews.map((r) => ({ id: r.id, category: r.category }));

  const { data, error } = await supabase.from("ai_generated_product_reviews").select("id, category");
  if (error) {
    console.error("Failed to read ai_generated_product_reviews:", error.message);
    process.exit(1);
  }
  const generatedRefs: ReviewRef[] = (data ?? []).map((r) => ({ id: r.id as string, category: r.category as string }));

  return [...staticRefs, ...generatedRefs];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const all = await collectAllReviews();
  console.log(`Found ${all.length} reviews total (${productReviews.length} static + ${all.length - productReviews.length} generated).`);

  const batches = chunk(all, BATCH_SIZE);
  let totalAssigned = 0;
  let totalPending = 0;
  let totalApiCalls = 0;

  for (const [i, batch] of batches.entries()) {
    console.log(`Batch ${i + 1}/${batches.length} (${batch.length} reviews)...`);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-review-images`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": CRON_SECRET },
      body: JSON.stringify({ reviews: batch, force: FORCE }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`  Failed [${res.status}]:`, body);
      continue;
    }
    console.log(`  Assigned ${body.assigned}/${body.pending} pending, ${body.apiCalls} API calls.`);
    totalAssigned += body.assigned ?? 0;
    totalPending += body.pending ?? 0;
    totalApiCalls += body.apiCalls ?? 0;
    // Be polite to Pexels/Unsplash rate limits between batches.
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone. ${totalAssigned}/${totalPending} pending reviews got a new image (${totalApiCalls} total API calls).`);
}

void main();
