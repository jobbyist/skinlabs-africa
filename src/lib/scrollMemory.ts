/**
 * Scroll position memory: Back from an article returns to the exact spot in the feed.
 * Positions are kept per history entry (react-router's `location.key`) in sessionStorage, capped so it can't grow.
 */
const STORAGE_KEY = "skinlabs:scroll-memory";
export const MAX_ENTRIES = 60;

type Memory = Record<string, number>;

const read = (): Memory => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Memory) : {};
  } catch {
    return {};
  }
};

/** Pure: adds one entry, dropping the oldest beyond the cap (object key order = insertion order). */
export const withEntry = (memory: Memory, key: string, y: number, max = MAX_ENTRIES): Memory => {
  const next: Memory = { ...memory };
  delete next[key];
  next[key] = Math.max(0, Math.round(y));
  const keys = Object.keys(next);
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) delete next[k];
  return next;
};

export const rememberScroll = (key: string, y: number) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(withEntry(read(), key, y)));
  } catch {
    /* private mode / quota: restoration simply falls back to top */
  }
};

export const recallScroll = (key: string): number | null => {
  const y = read()[key];
  return typeof y === "number" && Number.isFinite(y) ? y : null;
};

/** What a navigation should do with the scroll position (pure, tested). */
export type ScrollIntent =
  | { type: "restore"; y: number }
  | { type: "hash"; id: string }
  | { type: "top" };

export const resolveScrollIntent = (input: { navType: string; hash: string; remembered: number | null }): ScrollIntent => {
  if (input.navType === "POP" && input.remembered !== null && input.remembered > 0) return { type: "restore", y: input.remembered };
  const id = decodeId(input.hash);
  if (id) return { type: "hash", id };
  return { type: "top" };
};

const decodeId = (hash: string): string => {
  const raw = hash.replace(/^#/, "");
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** Back-to-top appears once the visitor is past this many viewport heights. */
export const BACK_TO_TOP_THRESHOLD = 1.5;
export const shouldShowBackToTop = (scrollY: number, viewportHeight: number) => viewportHeight > 0 && scrollY > viewportHeight * BACK_TO_TOP_THRESHOLD;
