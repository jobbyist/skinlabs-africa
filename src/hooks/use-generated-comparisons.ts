import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ComparisonArticle, ComparedProduct, ComparisonVerdict, ComparisonFaq } from "@/data/comparisons";

/**
 * Shelf Showdown comparisons sourced and written by the weekly comparison
 * pipeline (see supabase/functions/shelf-showdown-sync/index.ts), stored in
 * ai_generated_comparisons rather than hand-added to
 * src/data/comparisons-part*.ts so a new week's showdowns don't need a code
 * deploy. Mapped to the exact ComparisonArticle shape so Compare.tsx and
 * ComparisonArticle.tsx can merge them in unmodified alongside the static
 * catalogue -- same pattern as use-generated-reviews.ts for product reviews.
 */
async function fetchGeneratedComparisons(): Promise<ComparisonArticle[]> {
  const { data, error } = await supabase
    .from("ai_generated_comparisons")
    .select(
      "id, title, dek, sa_context, body_markdown, key_takeaways, verdicts, faqs, products_compared, thumbnail_url, thumbnail_alt, thumbnail_credit_name, thumbnail_credit_url, reading_time, seo_title, seo_description, publish_date, modified_date",
    )
    .order("publish_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row): ComparisonArticle => ({
    slug: row.id,
    title: row.title,
    dek: row.dek,
    saContext: row.sa_context,
    publishDate: row.publish_date,
    modifiedDate: row.modified_date,
    readingTime: row.reading_time,
    thumbnail: {
      url: row.thumbnail_url,
      alt: row.thumbnail_alt,
      creditName: row.thumbnail_credit_name,
      creditUrl: row.thumbnail_credit_url,
    },
    productsCompared: (row.products_compared as unknown as ComparedProduct[]) ?? [],
    bodyMarkdown: row.body_markdown,
    verdicts: (row.verdicts as unknown as ComparisonVerdict[]) ?? [],
    keyTakeaways: row.key_takeaways ?? [],
    faqs: (row.faqs as unknown as ComparisonFaq[]) ?? undefined,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  }));
}

/** All pipeline-generated Shelf Showdowns, mapped to ComparisonArticle shape and
 *  ready to merge with the static comparisonArticles catalogue. */
export function useGeneratedComparisons() {
  return useQuery({
    queryKey: ["ai-generated-comparisons"],
    queryFn: fetchGeneratedComparisons,
    staleTime: 5 * 60 * 1000,
  });
}
