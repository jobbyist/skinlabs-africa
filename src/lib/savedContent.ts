/**
 * Saved + liked content, persisted. One place for the rules so every surface (briefing cards,
 * article page, podcast, the dashboard's Saved tab) agrees:
 *
 *  - Briefings: saves and likes live in `news_article_engagement` (account, cross-device). Likes used to be
 *    written to this browser only, so they never reached the Saved tab; `reconcileBriefingLikes` merges the
 *    two once signed in (union, then pushes anything only this device knew about to the account).
 *  - Podcast episodes: likes live in `podcast_likes` (account); `loadLikedEpisodeSlugs` restores them so a
 *    heart is still filled after a reload or on another device.
 *  - Reviews and Spotlight brands: liked on this device only (zustand `skinlabs-engagement`), listed in Saved
 *    as such. There is no account table for them.
 */
import { supabase } from "@/integrations/supabase/client";
import { getLikedBriefingIds } from "@/lib/briefing-engagement";

const LIKED_BRIEFINGS_KEY = "skinlabs-liked-briefings";

/** Union keeping first-seen order; pure. */
export const mergeIds = (...lists: (readonly string[] | null | undefined)[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const id of list ?? []) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
};

/** Ids on this device that the account doesn't have yet. */
export const idsMissingFrom = (local: readonly string[], remote: readonly string[]): string[] => {
  const have = new Set(remote);
  return local.filter((id) => !have.has(id));
};

const writeLocalLikes = (ids: string[]) => {
  try {
    window.localStorage.setItem(LIKED_BRIEFINGS_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: the account copy still holds */
  }
};

/** Postgres unique violation: already there, which is the state we wanted. */
const isDuplicate = (error: { code?: string } | null) => error?.code === "23505";

export const syncBriefingLike = async (userId: string, articleId: string, liked: boolean): Promise<boolean> => {
  const query = supabase.from("news_article_engagement");
  const { error } = liked
    ? await query.insert({ user_id: userId, article_id: articleId, kind: "like" })
    : await query.delete().eq("user_id", userId).eq("article_id", articleId).eq("kind", "like");
  return !error || isDuplicate(error);
};

/** Merge this device's liked briefings with the account's, both ways. Returns the merged ids. */
export const reconcileBriefingLikes = async (userId: string): Promise<string[]> => {
  const local = getLikedBriefingIds();
  const { data, error } = await supabase
    .from("news_article_engagement")
    .select("article_id")
    .eq("user_id", userId)
    .eq("kind", "like");
  if (error) return local; // offline / failed read: keep what the device has, try again next time
  const remote = (data ?? []).map((r) => r.article_id as string);
  const merged = mergeIds(remote, local);
  writeLocalLikes(merged);
  for (const articleId of idsMissingFrom(local, remote)) await syncBriefingLike(userId, articleId, true);
  return merged;
};

export const loadLikedEpisodeSlugs = async (userId: string): Promise<string[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("podcast_likes").select("episode_slug").eq("user_id", userId);
  if (error) return [];
  return ((data ?? []) as { episode_slug: string }[]).map((r) => r.episode_slug);
};
