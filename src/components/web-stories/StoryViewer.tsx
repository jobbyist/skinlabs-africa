import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { Story } from "@/lib/webStories/stories";
import { logStoryEvent } from "@/lib/webStories/analytics";
import { cn } from "@/lib/utils";

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
  onViewed: (storyKey: string) => void;
}

const HOLD_TO_PAUSE_MS = 180;
const SWIPE_CLOSE_PX = 80;
const MAX_VIDEO_MS = 60_000;
const MEDIA_READY_TIMEOUT_MS = 4000;

/**
 * Full-screen, Instagram-style story player for the mobile story rail.
 * Tap right/left to move forward/back, hold to pause, swipe down (or Esc) to
 * close. Each story auto-advances into the next one. Pauses itself whenever
 * the tab is hidden so it never races ahead in the background.
 */
const StoryViewer = ({ stories, startIndex, onClose, onViewed }: StoryViewerProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [pageIndex, setPageIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  // Readiness is keyed to the page it belongs to: a cached image can fire
  // onLoad before a page-change effect runs, so a plain boolean reset in that
  // effect could overwrite the load and freeze the story.
  const [readyPageKey, setReadyPageKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);

  const elapsedRef = useRef(0);
  const advancedRef = useRef(false);
  const onViewedRef = useRef(onViewed);
  onViewedRef.current = onViewed;
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointerRef = useRef<{ x: number; y: number; holdTimer: number | null; didHold: boolean } | null>(null);

  const story = stories[storyIndex];
  const page = story?.pages[pageIndex];
  const pageKey = `${storyIndex}-${pageIndex}`;
  const mediaReady = readyPageKey === pageKey;
  const markReady = useCallback(() => setReadyPageKey(pageKey), [pageKey]);
  const paused = held || userPaused || tabHidden || !mediaReady;
  const isVideo = page?.mediaType === "video";

  const finishStory = useCallback(() => {
    if (story) logStoryEvent(story.key, "complete");
  }, [story]);

  const next = useCallback(() => {
    if (!story) return;
    if (pageIndex < story.pages.length - 1) {
      setPageIndex(pageIndex + 1);
    } else if (storyIndex < stories.length - 1) {
      finishStory();
      setStoryIndex(storyIndex + 1);
      setPageIndex(0);
    } else {
      finishStory();
      onClose();
    }
  }, [story, pageIndex, storyIndex, stories.length, finishStory, onClose]);

  const prev = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setPageIndex(0);
    } else {
      elapsedRef.current = 0;
      setProgress(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [pageIndex, storyIndex]);

  // New story: mark viewed + log an open.
  useEffect(() => {
    if (!story) return;
    onViewedRef.current(story.key);
    logStoryEvent(story.key, "open");
  }, [story]);

  // New page: reset timing, log the view, preload the following image.
  useEffect(() => {
    if (!story || !page) return;
    elapsedRef.current = 0;
    advancedRef.current = false;
    setProgress(0);
    setVideoDurationMs(null);
    logStoryEvent(story.key, "page_view", pageIndex);
    const upcoming = story.pages[pageIndex + 1] ?? stories[storyIndex + 1]?.pages[0];
    if (upcoming?.mediaType === "image") new Image().src = upcoming.mediaUrl;
  }, [story, page, pageIndex, storyIndex, stories]);

  // Never let a slow or stalled media request freeze the story.
  useEffect(() => {
    const timeout = window.setTimeout(markReady, MEDIA_READY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [markReady]);

  // Image pages: advance on a timer that only runs while not paused.
  useEffect(() => {
    if (!page || isVideo || paused) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      const ratio = Math.min(1, elapsedRef.current / page.durationMs);
      setProgress(ratio);
      if (ratio >= 1) {
        next();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [page, isVideo, paused, next]);

  // Video pages: the element drives progress; pause/resume follows `paused`.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (paused && mediaReady) video.pause();
    else if (!paused) void video.play().catch(() => setUserPaused(true));
  }, [paused, isVideo, mediaReady]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
      else if (event.key === " ") {
        event.preventDefault();
        setUserPaused((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [next, prev, onClose]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const holdTimer = window.setTimeout(() => {
      if (pointerRef.current) pointerRef.current.didHold = true;
      setHeld(true);
    }, HOLD_TO_PAUSE_MS);
    pointerRef.current = { x: event.clientX, y: event.clientY, holdTimer, didHold: false };
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start) return;
    if (start.holdTimer) window.clearTimeout(start.holdTimer);
    setHeld(false);
    if (event.clientY - start.y > SWIPE_CLOSE_PX) {
      onClose();
      return;
    }
    if (start.didHold) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX - bounds.left < bounds.width * 0.3) prev();
    else next();
  };

  const onPointerCancel = () => {
    if (pointerRef.current?.holdTimer) window.clearTimeout(pointerRef.current.holdTimer);
    pointerRef.current = null;
    setHeld(false);
  };

  // A video can report both its capped end (timeupdate) and `ended`; advance once.
  const advanceVideoOnce = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    next();
  };

  if (!story || !page) return null;

  const cta = story.ctaUrl ? { url: story.ctaUrl, label: story.ctaLabel || "Read more" } : null;
  const ctaClass =
    "pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition-transform active:scale-95";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Story: ${story.title}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-black">
        {/* Media */}
        {isVideo ? (
          <video
            key={`${story.key}-${pageIndex}`}
            ref={videoRef}
            src={page.mediaUrl}
            poster={page.posterUrl ?? undefined}
            muted={muted}
            playsInline
            preload="auto"
            aria-label={page.mediaAlt || undefined}
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedMetadata={(e) => {
              const ms = e.currentTarget.duration * 1000;
              setVideoDurationMs(Number.isFinite(ms) ? Math.min(ms, MAX_VIDEO_MS) : page.durationMs);
              markReady();
            }}
            onTimeUpdate={(e) => {
              const duration = videoDurationMs ?? page.durationMs;
              const ratio = Math.min(1, (e.currentTarget.currentTime * 1000) / duration);
              setProgress(ratio);
              if (ratio >= 1) advanceVideoOnce();
            }}
            onEnded={advanceVideoOnce}
            onError={markReady}
          />
        ) : (
          <img
            key={`${story.key}-${pageIndex}`}
            src={page.mediaUrl}
            alt={page.mediaAlt}
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={markReady}
            onError={markReady}
          />
        )}

        {/* Scrims keep white text legible on any photo. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* Tap / hold / swipe surface */}
        <div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
          aria-hidden="true"
        />

        {/* Progress + header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {story.pages.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <div
                  className="h-full bg-white"
                  style={{ width: `${i < pageIndex ? 100 : i === pageIndex ? progress * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <img src={story.coverImageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/60 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{story.title}</p>
              {story.isSponsored && (
                <p className="text-[11px] font-medium text-white/80">Sponsored{story.sponsorName ? ` · ${story.sponsorName}` : ""}</p>
              )}
            </div>
            <div className="pointer-events-auto flex items-center gap-1">
              {isVideo && (
                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="rounded-full p-2 text-white hover:bg-white/15"
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                aria-label={userPaused ? "Play story" : "Pause story"}
                className="rounded-full p-2 text-white hover:bg-white/15"
              >
                {userPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close stories"
                className="rounded-full p-2 text-white hover:bg-white/15"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Copy + call to action */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {page.headline && (
            <h2 className="font-heading text-2xl font-bold leading-tight text-white drop-shadow-sm">{page.headline}</h2>
          )}
          {page.body && <p className="mt-2 text-[15px] leading-relaxed text-white/90">{page.body}</p>}
          {cta && (
            <div className={cn("flex justify-center", page.headline || page.body ? "mt-5" : "")}>
              {cta.url.startsWith("/") ? (
                <Link
                  to={cta.url}
                  onClick={() => {
                    logStoryEvent(story.key, "cta_click", pageIndex);
                    onClose();
                  }}
                  className={ctaClass}
                >
                  {cta.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <a
                  href={cta.url}
                  target="_blank"
                  rel={story.isSponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                  onClick={() => logStoryEvent(story.key, "cta_click", pageIndex)}
                  className={ctaClass}
                >
                  {cta.label} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StoryViewer;
