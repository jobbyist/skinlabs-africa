import { podcastEpisodes } from "@/data/podcast";
import { seasonHubs } from "@/data/seasonals";
import { productReviews } from "@/data/reviews";
import { getProductImage } from "@/data/productImages";
import { announcementsForMonth } from "@/data/announcements";
import {
  GIVEAWAY_ASSESSMENT_PATH,
  GIVEAWAY_COPY,
  GIVEAWAY_DEADLINE_LABEL,
  GIVEAWAY_PATH,
  GIVEAWAY_PRIZES,
  GIVEAWAY_STORY_SLUG,
  GIVEAWAY_TIKTOK_HANDLE,
  isGiveawayOpen,
} from "@/lib/giveaway/campaign";
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

export const ICYMI_SEPTEMBER_2026_SLUG = "icymi-september-2026";
const ANNOUNCEMENTS_MEDIA = "/stories-media/announcements";

/**
 * The September 2026 recap video. A unit test (webStories.test.ts) fails if
 * this is true while the files are missing, so the story can't ship pointing
 * at a 404. Files (9:16):
 *   icymi-september-2026.mp4     — 720×1280, 30 fps, H.264 CRF 26, faststart,
 *                                  no audio track (the source was silent);
 *                                  1.2 MB, down from the 11.6 MB 1080p/50 fps original
 *   icymi-september-2026.jpg     — poster (first title frame)
 *   icymi-september-2026-bg.jpg  — blurred, darkened photo panel used behind
 *                                  the text pages (every video frame carries
 *                                  its own text, so the poster can't sit
 *                                  under a white headline)
 */
export const ICYMI_SEPTEMBER_2026_VIDEO_READY = true;
export const ICYMI_SEPTEMBER_2026_MEDIA = {
  video: `${ANNOUNCEMENTS_MEDIA}/icymi-september-2026.mp4`,
  poster: `${ANNOUNCEMENTS_MEDIA}/icymi-september-2026.jpg`,
  background: `${ANNOUNCEMENTS_MEDIA}/icymi-september-2026-bg.jpg`,
} as const;

/**
 * "Announcements" story: the recap video, then one page per announcement
 * published that month, text taken verbatim from src/data/announcements.ts.
 */
export const icymiSeptember2026Story = (): Story => {
  const { video, poster, background } = ICYMI_SEPTEMBER_2026_MEDIA;
  const items = announcementsForMonth("2026-09");
  return {
    key: ICYMI_SEPTEMBER_2026_SLUG,
    source: "curated",
    slug: ICYMI_SEPTEMBER_2026_SLUG,
    title: "ICYMI: September 2026",
    kind: "video",
    coverImageUrl: poster,
    coverImageAlt: "ICYMI: September 2026 — SkinLabs announcements",
    ctaLabel: "See all announcements",
    ctaUrl: "/announcements",
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: "2026-09-28",
    pages: [
      {
        ...page({
          mediaUrl: video,
          mediaAlt: "ICYMI: September 2026 — a recap of what's new on SkinLabs",
          // The video carries its own headline and copy on every frame.
          headline: null,
          body: null,
        }),
        mediaType: "video",
        posterUrl: poster,
      },
      ...items.map((item) =>
        page({
          mediaUrl: background,
          mediaAlt: "",
          headline: item.title,
          body: item.description,
          ctaLabel: "Read the announcement",
          ctaUrl: "/announcements",
        }),
      ),
    ],
  };
};

export const GIVEAWAY_OCT_2026_SLUG = GIVEAWAY_STORY_SLUG;
const GIVEAWAY_MEDIA_DIR = "/stories-media/giveaway";
/**
 * Campaign files (9:16). A unit test fails if any is missing:
 *   october-2026.mp4     720×1280, 30 fps, H.264 CRF 26, faststart, no audio track (the source was silent);
 *                        0.87 MB, down from the 7.7 MB 1080p/50 fps original
 *   october-2026.jpg     poster (the frame with the full headline; every video frame carries its own text)
 *   october-2026-bg.jpg  blurred, darkened panel behind the text page
 */
export const GIVEAWAY_OCT_2026_MEDIA = {
  video: `${GIVEAWAY_MEDIA_DIR}/october-2026.mp4`,
  poster: `${GIVEAWAY_MEDIA_DIR}/october-2026.jpg`,
  background: `${GIVEAWAY_MEDIA_DIR}/october-2026-bg.jpg`,
} as const;

/** The October 2026 giveaway story: the campaign video, then the how-to-enter summary. Listed only while the giveaway is open. */
export const giveawayOctober2026Story = (): Story => {
  const { video, poster, background } = GIVEAWAY_OCT_2026_MEDIA;
  return {
    key: GIVEAWAY_OCT_2026_SLUG,
    source: "curated",
    slug: GIVEAWAY_OCT_2026_SLUG,
    title: "Win R500 + Lifetime Glow Insider",
    kind: "video",
    coverImageUrl: poster,
    coverImageAlt: "SkinLabs® October 2026 Skin Story Giveaway: get your free skin analysis",
    ctaLabel: GIVEAWAY_COPY.enterCta,
    ctaUrl: GIVEAWAY_PATH,
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: "2026-10-03",
    pages: [
      {
        ...page({
          mediaUrl: video,
          mediaAlt: "SkinLabs® October giveaway: get your free skin analysis, then share your results on your TikTok Story",
          // The video carries its own headline and copy on every frame.
          headline: null,
          body: null,
          ctaLabel: GIVEAWAY_COPY.enterCta,
          ctaUrl: GIVEAWAY_PATH,
        }),
        mediaType: "video",
        posterUrl: poster,
      },
      page({
        mediaUrl: background,
        mediaAlt: "",
        headline: "Get your free skin analysis",
        body: `Complete the free AI skin assessment, share your Skin Story on your TikTok Story and tag ${GIVEAWAY_TIKTOK_HANDLE}. Two winners each get a ${GIVEAWAY_PRIZES.voucher} and ${GIVEAWAY_PRIZES.subscription}. Entries close ${GIVEAWAY_DEADLINE_LABEL}.`,
        ctaLabel: GIVEAWAY_COPY.storyAssessmentCta,
        ctaUrl: GIVEAWAY_ASSESSMENT_PATH,
      }),
    ],
  };
};


export const PRACTICE_SUITE_BETA_SLUG = "practice-suite-beta-intake";
const PRACTICE_SUITE_MEDIA = "/stories-media/practice-suite";

/**
 * "Practice Suite Beta intake now live!": every claim is taken from the Practice Suite page (src/pages/PracticeSuite.tsx).
 * The INTAKE form is live; the product is not, and the first page says so. Backgrounds are generated brand gradients
 * (no photography), so nothing implies a finished product.
 */
export const practiceSuiteBetaStory = (): Story => {
  const bg = (n: number) => `${PRACTICE_SUITE_MEDIA}/bg-${n}.jpg`;
  const alt = "Dark SkinLabs® brand gradient";
  return {
    key: PRACTICE_SUITE_BETA_SLUG,
    source: "curated",
    slug: PRACTICE_SUITE_BETA_SLUG,
    title: "Practice Suite Beta intake now live!",
    kind: "editorial",
    coverImageUrl: bg(1),
    coverImageAlt: "Practice Suite Beta intake now live",
    ctaLabel: "Request early access",
    ctaUrl: "/practice-suite#access",
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: "2026-10-08",
    pages: [
      page({
        mediaUrl: bg(1),
        mediaAlt: alt,
        headline: "Practice Suite Beta intake now live!",
        body: "Early-access intake is open for the Practice Suite private beta. The product is still in development, and 25 practices get in first.",
        ctaLabel: "Request early access",
        ctaUrl: "/practice-suite#access",
      }),
      page({
        mediaUrl: bg(2),
        mediaAlt: alt,
        headline: "Practice admin, without the nonsense",
        body: "One loop, done properly: book, consult, note, invoice, get paid. Diary, notes, billing and reminders in one place, built around how South African practices work.",
        ctaLabel: "See the loop",
        ctaUrl: "/practice-suite",
      }),
      page({
        mediaUrl: bg(3),
        mediaAlt: alt,
        headline: "What's in the beta",
        body: "Diary and online booking. Intake and consent with e-signature. Notes with your name, a timestamp and an edit history. Invoicing in rand. Reminders by SMS and email.",
        ctaLabel: "See what's coming",
        ctaUrl: "/practice-suite#features",
      }),
      page({
        mediaUrl: bg(4),
        mediaAlt: alt,
        headline: "And what isn't",
        body: "Not in the beta: live medical aid claims, stock and dispensing, telehealth video, and lab and imaging links. Built for private-pay clinics first, and we'd rather say so now.",
      }),
      page({
        mediaUrl: bg(5),
        mediaAlt: alt,
        headline: "Twenty-five places. Waves of five.",
        body: "The private beta opens 11 January 2027. It's free during the beta, with no card. Tell us about your practice. Please don't put patient details in the form.",
        ctaLabel: "Request early access",
        ctaUrl: "/practice-suite#access",
      }),
    ],
  };
};

export const curatedStories = (now: Date | number = Date.now()): Story[] => [
  ...(isGiveawayOpen(now) ? [giveawayOctober2026Story()] : []),
  practiceSuiteBetaStory(),
  ...(ICYMI_SEPTEMBER_2026_VIDEO_READY ? [icymiSeptember2026Story()] : []),
  podcastSeasonOneStory(),
  springResetStory(),
];

export const findCuratedStory = (slug: string): Story | null => curatedStories().find((story) => story.slug === slug) ?? null;
