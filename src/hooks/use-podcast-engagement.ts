import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PodcastEpisode } from "@/data/podcast";

const LIKES_KEY = "skinlabs-podcast-likes";
const EXTRA_PLAYS_KEY = "skinlabs-podcast-extra-plays";

type CountMap = Record<string, number>;

const readMap = (key: string): CountMap => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

const writeMap = (key: string, map: CountMap) => {
  localStorage.setItem(key, JSON.stringify(map));
};

/**
 * Auth-only engagement for podcast cards.
 * - Displays seed + live increments
 * - Increments play count on each play (persists via localStorage + optional supabase insert)
 * - Like toggles persist per device; supabase insert when available for cross-device sync of play events
 */
export function usePodcastEngagement(episodes: PodcastEpisode[]) {
  const { user } = useAuth();
  const [extraPlays, setExtraPlays] = useState<CountMap>({});
  const [likes, setLikes] = useState<CountMap>({});
  const [likedByMe, setLikedByMe] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExtraPlays(readMap(EXTRA_PLAYS_KEY));
    setLikes(readMap(LIKES_KEY));
  }, []);

  const getPlays = useCallback(
    (episode: PodcastEpisode) => episode.seedPlays + (extraPlays[episode.slug] ?? 0),
    [extraPlays],
  );

  const getLikes = useCallback(
    (episode: PodcastEpisode) => episode.seedLikes + (likes[episode.slug] ?? 0),
    [likes],
  );

  const recordPlay = useCallback(
    async (episode: PodcastEpisode) => {
      if (!user) return;
      setExtraPlays((prev) => {
        const next = { ...prev, [episode.slug]: (prev[episode.slug] ?? 0) + 1 };
        writeMap(EXTRA_PLAYS_KEY, next);
        return next;
      });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("podcast_plays").insert({
          user_id: user.id,
          episode_slug: episode.slug,
          episode_title: episode.title,
        });
      } catch {
        // non-blocking if table/policy unavailable
      }
    },
    [user],
  );

  const toggleLike = useCallback(
    async (episode: PodcastEpisode) => {
      if (!user) return;
      const currently = likedByMe[episode.slug];
      setLikedByMe((prev) => ({ ...prev, [episode.slug]: !currently }));
      setLikes((prev) => {
        const delta = currently ? -1 : 1;
        const next = {
          ...prev,
          [episode.slug]: Math.max(0, (prev[episode.slug] ?? 0) + delta),
        };
        writeMap(LIKES_KEY, next);
        return next;
      });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (currently) {
          await (supabase as any)
            .from("podcast_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("episode_slug", episode.slug);
        } else {
          await (supabase as any).from("podcast_likes").insert({
            user_id: user.id,
            episode_slug: episode.slug,
          });
        }
      } catch {
        // non-blocking
      }
    },
    [user, likedByMe],
  );

  return {
    isAuthenticated: Boolean(user),
    getPlays,
    getLikes,
    isLiked: (slug: string) => Boolean(likedByMe[slug]),
    recordPlay,
    toggleLike,
    episodes,
  };
}
