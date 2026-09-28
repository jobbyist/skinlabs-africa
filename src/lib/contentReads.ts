import { supabase } from "@/integrations/supabase/client";

export type ContentReadType = "review" | "episode";

/**
 * Records the first time a signed-in member reads a full review or plays an
 * episode (member_content_reads, insert-once). Best effort and silent: it feeds
 * the Getting Started checklist, never gates anything.
 */
export const recordContentRead = async (userId: string | null | undefined, type: ContentReadType, slug: string) => {
  if (!userId || !slug) return;
  try {
    // No .select(): an insert-once upsert that returns nothing (ON CONFLICT DO NOTHING).
    await supabase
      .from("member_content_reads")
      .upsert({ user_id: userId, content_type: type, slug }, { onConflict: "user_id,content_type,slug", ignoreDuplicates: true });
  } catch {
    /* non-blocking */
  }
};
