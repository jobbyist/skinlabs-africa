import type { Story } from "@/lib/webStories/stories";

/**
 * Sponsored story ads shown BETWEEN stories in the in-app StoryViewer — never
 * in the rail itself, never as the first or last thing a viewer sees, never
 * two in a row. Each carries an "Advertisement" badge (StoryViewer) and links
 * out to the advertiser's affiliate URL with rel="sponsored".
 *
 * Media lives in public/stories-media/ads/ (NOT public/web-stories/, which is
 * routed to the SSR function). Encode new files with
 * scripts/compress-story-ads.sh. If a file is missing or fails to load, the
 * viewer skips the ad instead of showing a broken slide.
 *
 * Ad-light browsing: Glow Insider / VIP members don't get these (see
 * WebStoriesBar) — that is what the "Ad-light browsing" benefit on /pricing
 * refers to, so keep the two in step.
 */
export interface StoryAd {
  key: string;
  advertiser: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl: string | null;
  mediaAlt: string;
  ctaLabel: string;
  ctaUrl: string;
}

const ADS_DIR = "/stories-media/ads";
const AD_IMAGE_MS = 6000;
/** Fallback only — a video ad runs for its own length (StoryViewer caps it at 60s). */
const AD_VIDEO_FALLBACK_MS = 15000;

export const STORY_ADS: StoryAd[] = [
  {
    key: "ad-timeless-skin",
    advertiser: "Timeless Skin Care",
    mediaType: "video",
    mediaUrl: `${ADS_DIR}/timeless-skin.mp4`,
    posterUrl: `${ADS_DIR}/timeless-skin-poster.jpg`,
    mediaAlt: "Timeless Skin Care advertisement",
    ctaLabel: "Shop Timeless",
    ctaUrl: "https://c.trackmytarget.com/?a=yqzct5&i=r344bf&click_id=WEBSTORYADS",
  },
  {
    key: "ad-faithful-to-nature",
    advertiser: "Faithful to Nature",
    mediaType: "video",
    mediaUrl: `${ADS_DIR}/faithful-to-nature.mp4`,
    posterUrl: `${ADS_DIR}/faithful-to-nature-poster.jpg`,
    mediaAlt: "Faithful to Nature advertisement",
    ctaLabel: "Shop Faithful to Nature",
    ctaUrl: "https://c.trackmytarget.com/?a=vpmli3&i=r344bf&click_id=WEBSTORYADS",
  },
  {
    key: "ad-youthology",
    advertiser: "Youthology",
    mediaType: "image",
    mediaUrl: `${ADS_DIR}/youthology.webp`,
    posterUrl: null,
    mediaAlt: "Youthology advertisement",
    ctaLabel: "Shop Youthology",
    ctaUrl: "https://c.trackmytarget.com/?a=vpmli3&i=r344bf&click_id=WEBSTORYADS",
  },
];

export const storyFromAd = (ad: StoryAd): Story => ({
  key: ad.key,
  source: "ad",
  slug: ad.key,
  title: ad.advertiser,
  kind: "promotional",
  coverImageUrl: ad.posterUrl ?? ad.mediaUrl,
  coverImageAlt: ad.mediaAlt,
  ctaLabel: ad.ctaLabel,
  ctaUrl: ad.ctaUrl,
  isSponsored: true,
  sponsorName: ad.advertiser,
  railPosition: null,
  publishAt: "1970-01-01T00:00:00Z",
  pages: [
    {
      mediaType: ad.mediaType,
      mediaUrl: ad.mediaUrl,
      mediaAlt: ad.mediaAlt,
      posterUrl: ad.posterUrl,
      headline: null,
      body: null,
      durationMs: ad.mediaType === "video" ? AD_VIDEO_FALLBACK_MS : AD_IMAGE_MS,
    },
  ],
});

export const isStoryAd = (story: Story) => story.source === "ad";

/** Organic stories shown between two ads. */
export const STORY_AD_INTERVAL = 2;

export interface StoryPlaylist {
  stories: Story[];
  /** playlistIndex[railIndex] = where that rail story sits in `stories`. */
  playlistIndex: number[];
}

/**
 * Inserts one ad after every `interval` organic stories, rotating through
 * `ads`. Ads only go between two organic stories, so the viewer never opens on
 * or ends with an ad and ads are never adjacent.
 */
export const interleaveStoryAds = (
  stories: Story[],
  ads: Story[],
  interval = STORY_AD_INTERVAL,
  /** Which ad goes first — rotate per session so impressions spread across advertisers. */
  firstAd = 0,
): StoryPlaylist => {
  const playlist: Story[] = [];
  const playlistIndex: number[] = [];
  let adCursor = Math.max(0, Math.floor(firstAd));
  stories.forEach((story, i) => {
    playlistIndex.push(playlist.length);
    playlist.push(story);
    const hasNext = i < stories.length - 1;
    if (ads.length > 0 && interval > 0 && hasNext && (i + 1) % interval === 0) {
      playlist.push(ads[adCursor % ads.length]);
      adCursor++;
    }
  });
  return { stories: playlist, playlistIndex };
};
