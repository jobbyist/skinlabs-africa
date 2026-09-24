const SEARCH_HISTORY_KEY = "skinlabs-search-history";
const MAX_ENTRIES = 12;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface SearchHistoryEntry {
  query: string;
  ts: number;
}

const canUseStorage = () => typeof window !== "undefined";

const readRaw = (): SearchHistoryEntry[] => {
  if (!canUseStorage()) return [];
  try {
    const value = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SearchHistoryEntry =>
        typeof entry === "object" && entry !== null &&
        typeof (entry as SearchHistoryEntry).query === "string" &&
        typeof (entry as SearchHistoryEntry).ts === "number",
    );
  } catch {
    return [];
  }
};

const write = (entries: SearchHistoryEntry[]) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Search history remains usable for the current session when storage is unavailable.
  }
};

/** Reads recent searches, newest first, pruning anything older than 90 days (self-healing). */
export const getRecentSearches = (): SearchHistoryEntry[] => {
  const now = Date.now();
  const all = readRaw();
  const fresh = all
    .filter((entry) => now - entry.ts <= RETENTION_MS)
    .sort((a, b) => b.ts - a.ts);
  if (fresh.length !== all.length) write(fresh);
  return fresh;
};

/** Adds/moves a query to the front of recent searches (case-insensitive de-dupe). */
export const addRecentSearch = (query: string): SearchHistoryEntry[] => {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();
  const now = Date.now();
  const existing = getRecentSearches().filter(
    (entry) => entry.query.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [{ query: trimmed, ts: now }, ...existing].slice(0, MAX_ENTRIES);
  write(next);
  return next;
};

/** Removes a single recent search entry. */
export const removeRecentSearch = (query: string): SearchHistoryEntry[] => {
  const next = getRecentSearches().filter((entry) => entry.query !== query);
  write(next);
  return next;
};

/** Clears all recent search history for this browser. */
export const clearRecentSearches = (): SearchHistoryEntry[] => {
  write([]);
  return [];
};
