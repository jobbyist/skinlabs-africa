/**
 * Shared Web Story model — used by the mobile rail (WebStoriesBar), the
 * in-app StoryViewer and the server-rendered AMP pages, so all three agree
 * on what a story is and in which order it appears.
 */

export type WebStoryKind = "editorial" | "briefing" | "review" | "comparison" | "video" | "promotional";

export interface StoryPage {
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaAlt: string;
  posterUrl: string | null;
  headline: string | null;
  body: string | null;
  durationMs: number;
  /** Optional page-level call to action (e.g. "Listen to episode"); falls back to the story's. */
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export interface Story {
  /** Stable identity for viewed-state and analytics: the DB/curated slug, or `briefing-<slug>` / `review-<id>`. */
  key: string;
  /**
   * db: authored rows in web_stories. curated: built in code from site content
   * (src/lib/webStories/curated.ts). briefing/review: built from live content,
   * in-app only (no AMP page). ad: a sponsored story ad from storyAds.ts,
   * interleaved between stories in the viewer only (never in the rail).
   */
  source: "db" | "curated" | "briefing" | "ad";
  slug: string;
  title: string;
  kind: WebStoryKind;
  coverImageUrl: string;
  coverImageAlt: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
  railPosition: number | null;
  publishAt: string;
  pages: StoryPage[];
}

export interface WebStoryRow {
  slug: string;
  title: string;
  kind: WebStoryKind;
  cover_image_url: string;
  cover_image_alt: string;
  cta_label: string | null;
  cta_url: string | null;
  is_sponsored: boolean;
  sponsor_name: string | null;
  rail_position: number | null;
  publish_at: string;
  pages: WebStoryPageRow[] | null;
}

export interface WebStoryPageRow {
  position: number;
  media_type: "image" | "video";
  media_url: string;
  media_alt: string;
  poster_url: string | null;
  headline: string | null;
  body: string | null;
  duration_ms: number;
}

export interface BriefingStorySource {
  slug: string;
  title: string;
  excerpt: string;
  key_takeaways: string[] | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  publish_date: string;
}

export const WEB_STORY_SELECT =
  "slug, title, kind, cover_image_url, cover_image_alt, cta_label, cta_url, is_sponsored, sponsor_name, rail_position, publish_at, pages:web_story_pages(position, media_type, media_url, media_alt, poster_url, headline, body, duration_ms)";

const DEFAULT_PAGE_MS = 6000;
export const MAX_HEADLINE_CHARS = 120;
export const MAX_BODY_CHARS = 400;

/** Trims to `max` characters at a word boundary with an ellipsis — never mid-word. */
export const clipText = (text: string, max: number): string => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, "")}…`;
};
const BRIEFING_TAKEAWAY_PAGES = 3;
const PLACEHOLDER_COVER = "/briefing-placeholder-cover.svg";

export const storyFromRow = (row: WebStoryRow): Story => ({
  key: row.slug,
  source: "db",
  slug: row.slug,
  title: row.title,
  kind: row.kind,
  coverImageUrl: row.cover_image_url,
  coverImageAlt: row.cover_image_alt,
  ctaLabel: row.cta_label,
  ctaUrl: row.cta_url,
  isSponsored: row.is_sponsored,
  sponsorName: row.sponsor_name,
  railPosition: row.rail_position,
  publishAt: row.publish_at,
  pages: [...(row.pages ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((page) => ({
      mediaType: page.media_type,
      mediaUrl: page.media_url,
      mediaAlt: page.media_alt,
      posterUrl: page.poster_url,
      headline: page.headline,
      body: page.body,
      durationMs: page.duration_ms,
    })),
});

/**
 * A briefing rendered as a short story from its own published fields only
 * (title, excerpt, key takeaways) — never invented copy. Used to keep the
 * rail full in the app; not published as an AMP page (see web-stories route).
 */
export const storyFromBriefing = (article: BriefingStorySource): Story => {
  const cover = article.cover_image_url || PLACEHOLDER_COVER;
  const alt = article.cover_image_alt || article.title;
  const page = (headline: string | null, body: string | null): StoryPage => ({
    mediaType: "image",
    mediaUrl: cover,
    mediaAlt: alt,
    posterUrl: null,
    headline,
    body,
    durationMs: DEFAULT_PAGE_MS,
  });
  return {
    key: `briefing-${article.slug}`,
    source: "briefing",
    slug: article.slug,
    title: article.title,
    kind: "briefing",
    coverImageUrl: cover,
    coverImageAlt: alt,
    ctaLabel: "Read the full briefing",
    ctaUrl: `/briefings/${article.slug}`,
    isSponsored: false,
    sponsorName: null,
    railPosition: null,
    publishAt: article.publish_date,
    pages: [
      page(article.title, article.excerpt || null),
      ...(article.key_takeaways ?? []).slice(0, BRIEFING_TAKEAWAY_PAGES).map((takeaway, i) => page(`Takeaway ${i + 1}`, takeaway)),
    ],
  };
};

/** Default slots for sponsored stories that don't set rail_position: spaced, never adjacent. */
const SPONSORED_SLOTS = [3, 7, 11, 15];

/**
 * Orders the rail: stories with an explicit rail_position take that slot;
 * sponsored stories without one take the next free spaced slot (3, 7, 11…);
 * remaining authored stories fill the gaps newest-first, then `fillers` in
 * the order given (briefings, curated stories, reviews — see use-web-stories).
 */
export const arrangeRail = (authoredInput: Story[], fillersInput: Story[], maxItems = Number.POSITIVE_INFINITY): Story[] => {
  const authored = authoredInput.filter((s) => s.pages.length > 0);
  const briefings = fillersInput.filter((s) => s.pages.length > 0);
  const slots = new Map<number, Story>();
  const pinned = authored.filter((s) => s.railPosition !== null).sort((a, b) => a.railPosition! - b.railPosition!);
  for (const story of pinned) {
    let slot = story.railPosition!;
    while (slots.has(slot)) slot++;
    slots.set(slot, story);
  }
  for (const story of authored.filter((s) => s.railPosition === null && s.isSponsored)) {
    const slot = SPONSORED_SLOTS.find((candidate) => !slots.has(candidate));
    if (slot !== undefined) slots.set(slot, story);
  }
  const placed = new Set(slots.values());
  const fillers = [
    ...authored.filter((s) => !placed.has(s)).sort((a, b) => b.publishAt.localeCompare(a.publishAt)),
    ...briefings,
  ];

  const rail: Story[] = [];
  for (let position = 1; rail.length < maxItems; position++) {
    const fixed = slots.get(position);
    if (fixed) {
      rail.push(fixed);
      slots.delete(position);
      continue;
    }
    const next = fillers.shift();
    if (next) {
      rail.push(next);
      continue;
    }
    if (slots.size === 0) break;
    // No fillers left: pull the remaining pinned stories forward rather than leaving gaps.
    const [earliest] = [...slots.keys()].sort((a, b) => a - b);
    rail.push(slots.get(earliest)!);
    slots.delete(earliest);
  }
  return rail;
};
