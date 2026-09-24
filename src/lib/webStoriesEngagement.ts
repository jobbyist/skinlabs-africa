const VIEWED_STORIES_KEY = "skinlabs-viewed-web-stories";

const canUseStorage = () => typeof window !== "undefined";

const read = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Viewed-ring state remains usable for the current session when storage is unavailable.
  }
};

export const getViewedStoryIds = () => read<string[]>(VIEWED_STORIES_KEY, []);

export const markStoryViewed = (articleId: string) => {
  const viewedIds = getViewedStoryIds();
  if (viewedIds.includes(articleId)) return viewedIds;
  const next = [...viewedIds, articleId];
  write(VIEWED_STORIES_KEY, next);
  return next;
};
