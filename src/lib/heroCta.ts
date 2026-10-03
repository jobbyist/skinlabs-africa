/**
 * Context-aware homepage hero CTAs. Pure and deterministic: given what we
 * know about the visitor's activity, pick the ONE primary action they're most
 * likely to take plus up to two quieter secondary actions. Presentation only,
 * never authorization.
 */

export interface HeroCtaFacts {
  /** A Basic analysis is in progress (draft saved in this browser). */
  analysisDraft: boolean;
  /** A Basic analysis was finished (in this browser or saved to the account). */
  hasBasicAnalysis: boolean;
  /** Today's (latest) briefing, if any. */
  briefing: { slug: string; title: string; isToday: boolean } | null;
  /** The visitor already opened that briefing. */
  briefingStarted: boolean;
  /** An episode the visitor started but didn't finish. */
  podcastInProgress: { slug: string; title: string } | null;
  /** The latest episode, for "listen" when nothing is in progress. */
  latestEpisode: { slug: string; title: string } | null;
}

export type HeroCtaId = "basic" | "resume_basic" | "advanced" | "briefing" | "podcast";

export interface HeroCta {
  id: HeroCtaId;
  label: string;
  href: string;
}

export const ADVANCED_HREF = "/skynn-ai/advanced";

export const resolveHeroCtas = (f: HeroCtaFacts): { primary: HeroCta; secondary: HeroCta[] } => {
  const briefingCta: HeroCta | null = f.briefing
    ? {
        id: "briefing",
        label: f.briefingStarted
          ? "Continue reading today's briefing"
          : f.briefing.isToday
            ? "Read today's briefing"
            : "Read the latest briefing",
        href: `/briefings/${f.briefing.slug}`,
      }
    : null;

  const podcastCta: HeroCta | null = f.podcastInProgress
    ? { id: "podcast", label: "Continue listening", href: `/podcast/${f.podcastInProgress.slug}` }
    : f.latestEpisode
      ? { id: "podcast", label: "Listen to the latest episode", href: `/podcast/${f.latestEpisode.slug}` }
      : null;

  let primary: HeroCta;
  if (f.analysisDraft && !f.hasBasicAnalysis) {
    primary = { id: "resume_basic", label: "Finish your free skin analysis", href: "/skynn-ai" };
  } else if (f.hasBasicAnalysis) {
    primary = { id: "advanced", label: "Try the Advanced AI Dermatology Analysis", href: ADVANCED_HREF };
  } else {
    primary = { id: "basic", label: "Get Your Free Basic AI Skin Report", href: "/skynn-ai" };
  }

  // Something already in progress is the likeliest click, so it goes first.
  const ordered = [
    f.podcastInProgress ? podcastCta : null,
    f.briefingStarted ? briefingCta : null,
    briefingCta,
    podcastCta,
  ].filter((c): c is HeroCta => Boolean(c));
  const secondary: HeroCta[] = [];
  for (const c of ordered) if (!secondary.some((s) => s.id === c.id)) secondary.push(c);

  return { primary, secondary: secondary.slice(0, 2) };
};
