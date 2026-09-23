import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  arrangeRail,
  storyFromBriefing,
  storyFromRow,
  WEB_STORY_SELECT,
  type BriefingStorySource,
  type Story,
  type WebStoryRow,
} from "@/lib/webStories/stories";

const BRIEFING_TOP_UP = 12;

const fetchRail = async (): Promise<Story[]> => {
  // RLS already limits web_stories to published, in-window rows.
  const [authored, briefings] = await Promise.all([
    supabase.from("web_stories").select(WEB_STORY_SELECT).order("publish_at", { ascending: false }).limit(20),
    supabase
      .from("news_articles_public")
      .select("slug, title, excerpt, key_takeaways, cover_image_url, cover_image_alt, publish_date")
      .order("publish_date", { ascending: false })
      .limit(BRIEFING_TOP_UP),
  ]);
  if (authored.error) console.error("web_stories fetch failed:", authored.error);
  if (briefings.error) console.error("briefing stories fetch failed:", briefings.error);

  return arrangeRail(
    ((authored.data ?? []) as unknown as WebStoryRow[]).map(storyFromRow),
    ((briefings.data ?? []) as unknown as BriefingStorySource[]).map(storyFromBriefing),
  );
};

export const useWebStories = () =>
  useQuery({ queryKey: ["web-stories-rail"], queryFn: fetchRail, staleTime: 5 * 60_000 });
