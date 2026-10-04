import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Maximize2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GIVEAWAY_COPY } from "@/lib/giveaway/campaign";
import { trackGiveawayCta } from "@/lib/giveaway/analytics";
import { GIVEAWAY_OCT_2026_MEDIA, giveawayOctober2026Story } from "@/lib/webStories/curated";

const StoryViewer = lazy(() => import("@/components/web-stories/StoryViewer"));

/**
 * The campaign video as a story-style card. Nothing is downloaded until the card is on screen:
 * the poster (66 KB) is a plain lazy <img>; the 0.87 MB video is mounted only once ≥50 % visible
 * (and never for visitors who prefer reduced motion, who get a tap-to-play button instead), muted + playsInline so
 * iOS Safari and the TikTok in-app browser allow autoplay, and paused again when scrolled away. If autoplay is
 * refused the poster stays with a clear play button. "Full screen" opens the existing StoryViewer on demand.
 */
const GiveawayStoryPlayer = ({ onEnter }: { onEnter: () => void }) => {
  const { video, poster } = GIVEAWAY_OCT_2026_MEDIA;
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = player.current;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!reduce) setMounted(true);
          if (v) void v.play().catch(() => setPlaying(false));
        } else if (v) {
          v.pause();
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const startManually = () => {
    setMounted(true);
    // The element mounts on the next render; play() is retried from its own autoPlay/ref effect below.
    requestAnimationFrame(() => void player.current?.play().catch(() => undefined));
  };

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div
        ref={holder}
        className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-border bg-muted shadow-lg"
      >
        <img
          src={poster}
          alt="SkinLabs® giveaway story: get your free skin analysis, then share your results on your TikTok Story"
          width={720}
          height={1280}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {mounted && (
          <video
            ref={player}
            src={video}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-label="SkinLabs® October giveaway video"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {!playing && (
          <button
            type="button"
            onClick={startManually}
            aria-label="Play the giveaway video"
            className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md">
              <Play className="h-6 w-6 translate-x-0.5" aria-hidden="true" />
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="Open the story full screen"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4">
        <Button
          size="lg"
          className="h-12 w-full rounded-full"
          onClick={() => {
            trackGiveawayCta("story", "enter");
            onEnter();
          }}
        >
          {GIVEAWAY_COPY.enterCta}
        </Button>
      </div>

      {fullscreen && (
        <Suspense fallback={null}>
          <StoryViewer stories={[giveawayOctober2026Story()]} startIndex={0} onClose={() => setFullscreen(false)} onViewed={() => undefined} />
        </Suspense>
      )}
    </div>
  );
};

export default GiveawayStoryPlayer;
