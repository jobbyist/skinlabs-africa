import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { curatedStories } from "@/lib/webStories/curated";
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
}

const fetchRailSources = async (): Promise<RailSources> => {
  // RLS already limits web_stories to published, in-window rows.
  const [authored, briefings] = await Promise.all([
    supabase.from("web_stories").select(WEB_STORY_SELECT).order("publish_at", { ascending: false }).limit(20),
    supabase
      .from("news_articles_public")
      .select("slug, title, excerpt, key_takeaways, cover_image_url, cover_image_alt, publish_date")
      .order("publish_date", { ascending: false })
      .limit(DAILY_BRIEFINGS),
  ]);
  if (authored.error) console.error("web_stories fetch failed:", authored.error);
  if (briefings.error) console.error("briefing stories fetch failed:", briefings.error);

  return {
    authored: ((authored.data ?? []) as unknown as WebStoryRow[]).map(storyFromRow),
    briefings: ((briefings.data ?? []) as unknown as BriefingStorySource[]).map(storyFromBriefing),
  };
};

/**
 * The mobile story rail, in order: authored stories (sponsored ones spaced
 * by arrangeRail), the latest briefings, then the curated Podcast + Spring
 * Reset stories. Product reviews are deliberately not featured in the rail.
 * Briefings are a live query, so a day's new ones appear without a deploy.
 */
export const useWebStories = () => {
  const sources = useQuery({ queryKey: ["web-stories-rail"], queryFn: fetchRailSources, staleTime: 5 * 60_000 });

  const data = useMemo(() => {
    if (!sources.data) return undefined;
    const { authored, briefings } = sources.data;
    return arrangeRail(authored, [...briefings, ...curatedStories()]);
  }, [sources.data]);

  return { data, isLoading: sources.isLoading };
};
