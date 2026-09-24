import { podcastEpisodes } from "@/data/podcast";
import { seasonHubs } from "@/data/seasonals";
import { productReviews } from "@/data/reviews";
import { getProductImage } from "@/data/productImages";
import { clipText, MAX_BODY_CHARS, MAX_HEADLINE_CHARS, type Story, type StoryPage } from "./stories";

/**
 * Stories built in code from existing site content — every word is taken
 * from the source data (episode titles/descriptions, The Spring Reset's own
 * copy), never written fresh here. Because they read the same data files as
 * the podcast and Seasonals pages, they stay in sync automatically (e.g. when
 * episode 10 stops being "coming soon"). Served in-app and as AMP pages.
 */

const PODCAST_MEDIA = "/stories-media/podcast-s1";
const PAGE_MS = 7000;

const page = (fields: Omit<StoryPage, "mediaType" | "posterUrl" | "durationMs"> & { durationMs?: number }): StoryPage => ({
  mediaType: "image",
  posterUrl: null,
  durationMs: PAGE_MS,
  ...fields,
  headline: fields.headline ? clipText(fields.headline, MAX_HEADLINE_CHARS) : null,
  body: fields.body ? clipText(fields.body, MAX_BODY_CHARS) : null,
});

export const PODCAST_SEASON_1_SLUG = "skin-deep-podcast-season-1";

export const podcastSeasonOneStory = (): Story => {
  const episodes = podcastEpisodes.filter((episode) => episode.id >= 1 && episode.id <= 10).sort((a, b) => a.id - b.id);
  return {
    key: PODCAST_SEASON_1_SLUG,
    source: "curated",
    slug: PODCAST_SEASON_1_SLUG,
    title: "The Skin Deep Podcast — Season 1",
    kind: "editorial",
    coverImageUrl: `${PODCAST_MEDIA}/cover.jpg`,
    coverImageAlt: "The Skin Deep Podcast cover artwork",
    ctaLabel: "Listen on SkinLabs",
    ctaUrl: "/podcast",
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: episodes[0]?.publishedAt || "2026-08-21",
    pages: [
      page({
        mediaUrl: `${PODCAST_MEDIA}/cover.jpg`,
        mediaAlt: "The Skin Deep Podcast cover artwork",
        // The artwork itself carries the show title, so no headline over it.
        headline: null,
        body: "Skincare without the nonsense. Conversations on ingredient science, culture and routines — grounded in South African skin, climate and shelves.",
      }),
      ...episodes.map((episode) =>
        page({
          mediaUrl: `${PODCAST_MEDIA}/ep${episode.id}.jpg`,
          mediaAlt: `${episode.title} cover art`,
          headline: episode.title,
          // An unreleased episode is labelled as such and never linked as if playable.
          body: episode.comingSoon ? `Coming soon. ${episode.description}` : episode.description,
          ctaLabel: episode.comingSoon ? "See all episodes" : "Listen to this episode",
          ctaUrl: episode.comingSoon ? "/podcast" : `/podcast/${episode.slug}`,
        }),
      ),
    ],
  };
};

export const SPRING_RESET_SLUG = "the-spring-reset";

/** Portrait (9:16) crop of an Unsplash photo via its own image API; other URLs pass through. */
const portrait = (url: string): string => {
  if (!url.startsWith("https://images.unsplash.com/")) return url;
  const parsed = new URL(url);
  for (const [key, value] of Object.entries({ w: "1080", h: "1920", fit: "crop", crop: "entropy", q: "75", auto: "format" })) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
};

const springEditImage = (reviewId: string, fallback: { url: string; alt: string }) => {
  const review = productReviews.find((r) => r.id === reviewId);
  const image = review ? getProductImage(review.category, review.id) : null;
  return image ? { url: portrait(image.url), alt: image.alt } : fallback;
};

export const springResetStory = (): Story => {
  const hub = seasonHubs.spring;
  const hero = { url: portrait(hub.heroImage.url), alt: hub.heroImage.alt };
  const [spf, dryness, oiliness, pigmentation, hydration] = hub.priorityCards;
  // Each priority card is paired with the Spring Edit pick that addresses it.
  const cardImages = [
    springEditImage("sf-spf50-hybrid", hero),
    springEditImage("sb-renew-dew-ceramide-butter", hero),
    springEditImage("lelive-all-the-shade-spf30", hero),
    hero,
    springEditImage("sb-moisture-bomb", hero),
  ];
  const introSentences = hub.heroIntro.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

  return {
    key: SPRING_RESET_SLUG,
    source: "curated",
    slug: SPRING_RESET_SLUG,
    title: hub.h1,
    kind: "editorial",
    coverImageUrl: hero.url,
    coverImageAlt: hero.alt,
    ctaLabel: "Read The Spring Reset",
    ctaUrl: "/seasonals/spring",
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: hub.publishDate,
    pages: [
      page({ mediaUrl: hero.url, mediaAlt: hero.alt, headline: hub.h1, body: hub.tagline }),
      page({ mediaUrl: hero.url, mediaAlt: hero.alt, headline: hub.months, body: introSentences }),
      ...[spf, dryness, oiliness, pigmentation, hydration]
        .map((card, i) => (card ? page({ mediaUrl: cardImages[i].url, mediaAlt: cardImages[i].alt, headline: card.title, body: card.description }) : null))
        .filter((p): p is StoryPage => p !== null),
      page({ mediaUrl: hero.url, mediaAlt: hero.alt, headline: hub.worthKnowing.label, body: hub.worthKnowing.text }),
    ],
  };
};

export const curatedStories = (): Story[] => [podcastSeasonOneStory(), springResetStory()];

export const findCuratedStory = (slug: string): Story | null => curatedStories().find((story) => story.slug === slug) ?? null;
