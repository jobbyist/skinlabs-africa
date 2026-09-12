const LIKED_BRIEFINGS_KEY = "skinlabs-liked-briefings";
const BRIEFING_VIEWS_KEY = "skinlabs-briefing-views";

type StoredViews = Record<string, number>;

const canUseStorage = () => typeof window !== "undefined";

const read = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Engagement remains usable for the current session when storage is unavailable.
  }
};

export const getLikedBriefingIds = () => read<string[]>(LIKED_BRIEFINGS_KEY, []);

export const toggleLikedBriefing = (articleId: string) => {
  const likedIds = getLikedBriefingIds();
  const next = likedIds.includes(articleId)
    ? likedIds.filter((id) => id !== articleId)
    : [...likedIds, articleId];
  write(LIKED_BRIEFINGS_KEY, next);
  return next;
};

/** Records one browser-local view. Local storage has no expiry, so views survive reloads and sign-in changes. */
export const recordBriefingView = (articleId: string, baseline: number) => {
  const views = read<StoredViews>(BRIEFING_VIEWS_KEY, {});
  const next = (views[articleId] ?? 0) + 1;
  write(BRIEFING_VIEWS_KEY, { ...views, [articleId]: next });
  return baseline + next;
};
