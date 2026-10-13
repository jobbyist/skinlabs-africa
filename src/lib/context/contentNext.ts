/**
 * "What's next" in a series. Pure so it is testable: the next published episode after the one being
 * played (by episode number), or null when this is the latest, so the page never loops a listener
 * back to the start or recommends what they are already on.
 */
export const nextEpisodeAfter = <T extends { id: number; slug: string }>(published: readonly T[], currentSlug: string): T | null => {
  const sorted = [...published].sort((a, b) => a.id - b.id);
  const index = sorted.findIndex((e) => e.slug === currentSlug);
  if (index < 0) return null;
  return sorted[index + 1] ?? null;
};
