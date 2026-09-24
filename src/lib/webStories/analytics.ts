import { supabase } from "@/integrations/supabase/client";

export type StoryEvent = "open" | "page_view" | "complete" | "cta_click";

/**
 * Anonymous, fire-and-forget story engagement logging (no user id stored).
 * Inserted without .select(): the table is write-only for visitors, and a
 * RETURNING read would be rejected by its admin-only SELECT policy.
 */
export const logStoryEvent = (storyKey: string, event: StoryEvent, pageIndex?: number) => {
  void supabase
    .from("web_story_events")
    .insert({ story_key: storyKey, event, page_index: pageIndex ?? null, surface: "rail" })
    .then(({ error }) => {
      if (error) console.warn("web_story_events insert failed:", error.message);
    });
};
