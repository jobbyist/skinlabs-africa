/**
 * Client-side monthly access quotas for free-tier limits.
 * Keys rotate by calendar month (YYYY-MM). Not a security boundary —
 * paid tiers bypass these checks via useMembership.
 */

const monthKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const readList = (storageKey: string): string[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { month?: string; ids?: string[] };
    if (parsed.month !== monthKey()) return [];
    return Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  }
};

const writeList = (storageKey: string, ids: string[]) => {
  localStorage.setItem(storageKey, JSON.stringify({ month: monthKey(), ids }));
};

const PODCAST_KEY = "skinlabs-quota-podcast";
const COMPARE_KEY = "skinlabs-quota-compare";

export const PODCAST_FREE_MONTHLY = 1;
export const COMPARE_FREE_MONTHLY = 2;

export const getPodcastPlaysThisMonth = () => readList(PODCAST_KEY);
export const getCompareReadsThisMonth = () => readList(COMPARE_KEY);

export const canPlayPodcastEpisode = (slug: string) => {
  const ids = getPodcastPlaysThisMonth();
  return ids.includes(slug) || ids.length < PODCAST_FREE_MONTHLY;
};

export const recordPodcastPlay = (slug: string) => {
  const ids = getPodcastPlaysThisMonth();
  if (ids.includes(slug)) return;
  writeList(PODCAST_KEY, [...ids, slug]);
};

export const canReadComparison = (slug: string) => {
  const ids = getCompareReadsThisMonth();
  return ids.includes(slug) || ids.length < COMPARE_FREE_MONTHLY;
};

export const recordComparisonRead = (slug: string) => {
  const ids = getCompareReadsThisMonth();
  if (ids.includes(slug)) return;
  writeList(COMPARE_KEY, [...ids, slug]);
};
