import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productReviews } from "@/data/reviews";
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";
import { curatedStories } from "@/lib/webStories/curated";
import { resolveReviewStoryImage, storyFromReview, type ReviewImageMap } from "@/lib/webStories/reviewStories";
import {
  arrangeRail,
  storyFromBriefing,
  storyFromRow,
  WEB_STORY_SELECT,
  type BriefingStorySource,
  type Story,
  type WebStoryRow,
} from "@/lib/webStories/stories";

/** Up to this many of the newest Daily Skinny briefings feature in the rail. */
const DAILY_BRIEFINGS = 3;

interface RailSources {
  authored: Story[];
  briefings: Story[];
  reviewImages: ReviewImageMap;
}

const fetchRailSources = async (): Promise<RailSources> => {
  // RLS already limits web_stories to published, in-window rows.
  const [authored, briefings, images] = await Promise.all([
    supabase.from("web_stories").select(WEB_STORY_SELECT).order("publish_at", { ascending: false }).limit(20),
    supabase
      .from("news_articles_public")
      .select("slug, title, excerpt, key_takeaways, cover_image_url, cover_image_alt, publish_date")
      .order("publish_date", { ascending: false })
      .limit(DAILY_BRIEFINGS),
    supabase.from("review_images").select("review_id, image_url, alt"),
  ]);
  if (authored.error) console.error("web_stories fetch failed:", authored.error);
  if (briefings.error) console.error("briefing stories fetch failed:", briefings.error);

  const reviewImages: ReviewImageMap = {};
  for (const row of images.data ?? []) reviewImages[row.review_id] = { url: row.image_url, alt: row.alt ?? "" };

  return {
    authored: ((authored.data ?? []) as unknown as WebStoryRow[]).map(storyFromRow),
    briefings: ((briefings.data ?? []) as unknown as BriefingStorySource[]).map(storyFromBriefing),
    reviewImages,
  };
};

/**
 * The mobile story rail, in order: authored stories (sponsored ones spaced
 * by arrangeRail), the latest briefings, the curated Podcast + Spring Reset
 * stories, then every published review newest-first (pipeline reviews, then
 * the static catalogue). Briefings and reviews are live queries, so a day's
 * new content appears without a deploy.
 */
export const useWebStories = () => {
  const sources = useQuery({ queryKey: ["web-stories-rail"], queryFn: fetchRailSources, staleTime: 5 * 60_000 });
  const generated = useGeneratedReviews();

  const data = useMemo(() => {
    if (!sources.data) return undefined;
    const { authored, briefings, reviewImages } = sources.data;
    const seen = new Set<string>();
    const reviews = [...(generated.data ?? []), ...productReviews]
      .filter((review) => (seen.has(review.id) ? false : (seen.add(review.id), true)))
      .map((review) => storyFromReview(review, resolveReviewStoryImage(review, reviewImages)));
    return arrangeRail(authored, [...briefings, ...curatedStories(), ...reviews]);
  }, [sources.data, generated.data]);

  // Wait for pipeline reviews too, so circles don't reshuffle under a scrolling finger.
  return { data, isLoading: sources.isLoading || generated.isLoading };
};
