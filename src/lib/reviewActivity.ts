/**
 * Local, counts-only record of which reviews this browser opened lately, so
 * "you've been reading reviews" can unlock product comparison. Nothing leaves
 * the device; only slugs and day stamps are stored, capped, and expire.
 */
const KEY = "skinlabs:review-activity";
const WINDOW_DAYS = 14;
const MAX = 40;

interface Entry { slug: string; day: string }

const day = (d = new Date()) => d.toISOString().slice(0, 10);

const read = (storage?: Pick<Storage, "getItem">): Entry[] => {
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    const parsed = JSON.parse(s?.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((e): e is Entry => Boolean(e) && typeof (e as Entry).slug === "string" && typeof (e as Entry).day === "string")
      : [];
  } catch {
    return [];
  }
};

export const recordReviewView = (slug: string, storage?: Pick<Storage, "getItem" | "setItem">, now = new Date()) => {
  if (!slug) return;
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (!s) return;
    const entries = read(s).filter((e) => e.slug !== slug);
    entries.push({ slug, day: day(now) });
    s.setItem(KEY, JSON.stringify(entries.slice(-MAX)));
  } catch {
    /* private mode */
  }
};

/** Distinct reviews opened in the last 14 days. */
export const recentReviewViewCount = (storage?: Pick<Storage, "getItem">, now = new Date()): number => {
  const cutoff = day(new Date(now.getTime() - WINDOW_DAYS * 86_400_000));
  return new Set(read(storage).filter((e) => e.day >= cutoff).map((e) => e.slug)).size;
};
