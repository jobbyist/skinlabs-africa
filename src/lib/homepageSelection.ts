import type { FeaturedEditorial } from "@/data/editorials";

/** Fisher-Yates on a copy, so the source array is never reordered. */
export const shuffled = <T>(items: readonly T[], random: () => number = Math.random): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** The homepage's 3 featured Shelf Showdowns: random each load, published ones first, "coming soon" only to fill. */
export const pickRotatingEditorials = (
  pool: readonly FeaturedEditorial[],
  count = 3,
  random: () => number = Math.random,
): FeaturedEditorial[] => {
  const live = shuffled(pool.filter((e) => !e.comingSoon), random);
  if (live.length >= count) return live.slice(0, count);
  return [...live, ...shuffled(pool.filter((e) => e.comingSoon), random)].slice(0, count);
};
