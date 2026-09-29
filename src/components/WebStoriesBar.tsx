import { Suspense, useCallback, useMemo, useState } from "react";
import { useWebStories } from "@/hooks/use-web-stories";
import { useMembership } from "@/hooks/use-membership";
import { STORY_ADS, interleaveStoryAds, storyFromAd } from "@/lib/webStories/storyAds";
import { getViewedStoryIds, markStoryViewed } from "@/lib/webStoriesEngagement";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import { cn } from "@/lib/utils";

// Lazy: the viewer pulls in framer-motion, which this always-mounted header rail shouldn't ship up front.
const StoryViewer = lazyWithRetry(
  () => import("@/components/web-stories/StoryViewer"),
);

const SKELETON_COUNT = 6;
const PLACEHOLDER_COVER = "/briefing-placeholder-cover.svg";
const AD_STORIES = STORY_ADS.map(storyFromAd);
const FIRST_AD_KEY = "skinlabs-story-first-ad";

// Header (and so this rail) remounts on every page, so the random starting
// advertiser is kept in sessionStorage to stay fixed for the whole visit.
// Storage can throw (private mode, blocked site data) — fall back to random.
const pickSessionFirstAd = () => {
  try {
    const stored = sessionStorage.getItem(FIRST_AD_KEY);
    if (stored !== null && /^\d+$/.test(stored)) return Number(stored);
  } catch {
    // ignore
  }
  const random = Math.floor(Math.random() * AD_STORIES.length);
  try {
    sessionStorage.setItem(FIRST_AD_KEY, String(random));
  } catch {
    // ignore
  }
  return random;
};

const truncateLabel = (title: string, max = 15) =>
  title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;

interface WebStoriesBarProps {
  /** Matches the fixed offset Header.tsx computes for the promo bar (top-0 / top-9). */
  top: "top-0" | "top-9";
}

/**
 * Instagram-style story rail, mobile only (md:hidden), fixed directly above
 * the main nav <header>; Header.tsx renders the matching h-24 flow spacer.
 * Content: authored web_stories (sponsored ones spaced out and labelled —
 * see arrangeRail) topped up with the latest real briefings. Tapping a
 * circle opens the full-screen StoryViewer rather than leaving the page.
 */
const WebStoriesBar = ({ top }: WebStoriesBarProps) => {
  const { data: stories, isLoading } = useWebStories();
  const [viewedIds, setViewedIds] = useState<string[]>(getViewedStoryIds);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleViewed = useCallback(
    (key: string) => setViewedIds(markStoryViewed(key)),
    [],
  );
  const handleClose = useCallback(() => setOpenIndex(null), []);
  // Ad-light browsing (a Glow Insider/VIP benefit on /pricing): members get no
  // sponsored story ads between stories. Everyone else sees one after every
  // STORY_AD_INTERVAL stories, starting from a per-session random advertiser.
  const { isMember, loading: membershipLoading } = useMembership();
  const [firstAd] = useState(pickSessionFirstAd);
  const playlist = useMemo(
    () => interleaveStoryAds(stories ?? [], membershipLoading || isMember ? [] : AD_STORIES, undefined, firstAd),
    [stories, isMember, membershipLoading, firstAd],
  );

  if (!isLoading && (!stories || stories.length === 0)) return null;

  return (
    <>
      <nav
        aria-label="SkinLabs stories"
        className={cn(
          "scrollbar-hide fixed inset-x-0 z-[55] flex h-24 items-center gap-4 overflow-x-auto border-b border-border/60 bg-background/95 px-4 backdrop-blur-md md:hidden",
          top,
        )}
      >
        {isLoading || !stories
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center gap-1.5"
                aria-hidden="true"
              >
                <span className="h-16 w-16 animate-pulse rounded-full bg-muted" />
                <span className="h-2 w-12 animate-pulse rounded-full bg-muted" />
              </div>
            ))
          : stories.map((story, index) => {
              const viewed = viewedIds.includes(story.key);
              return (
                <button
                  key={story.key}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`${story.isSponsored ? "Sponsored story" : "Story"}: ${story.title}`}
                  className="flex shrink-0 flex-col items-center gap-1"
                >
                  {/* The badge sits outside the ring: .gradient-border-anim forces its
                      direct children to position:relative, which would pull an
                      absolutely positioned badge into the ring's flex layout. */}
                  <span className="relative shrink-0" aria-hidden="true">
                    <span
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-full p-[2px]",
                        viewed ? "bg-border" : "gradient-border-anim",
                      )}
                    >
                      <span className="h-full w-full overflow-hidden rounded-full border-2 border-background bg-muted">
                        <img
                          src={story.coverImageUrl}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            if (
                              !event.currentTarget.src.endsWith(
                                PLACEHOLDER_COVER,
                              )
                            )
                              event.currentTarget.src = PLACEHOLDER_COVER;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    </span>
                    {story.isSponsored && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-foreground px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-background">
                        Ad
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "max-w-[68px] truncate text-center text-[11px] leading-tight",
                      viewed
                        ? "text-muted-foreground"
                        : "font-medium text-foreground",
                    )}
                  >
                    {truncateLabel(story.title)}
                  </span>
                </button>
              );
            })}
      </nav>

      {openIndex !== null && stories && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[80] bg-black" aria-hidden="true" />
          }
        >
          <StoryViewer
            stories={playlist.stories}
            startIndex={playlist.playlistIndex[openIndex] ?? 0}
            onClose={handleClose}
            onViewed={handleViewed}
          />
        </Suspense>
      )}
    </>
  );
};

export default WebStoriesBar;
