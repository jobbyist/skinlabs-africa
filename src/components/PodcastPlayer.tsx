import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, X, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import type { PodcastEpisode } from "@/data/podcast";

// The episode catalogue (show notes, transcripts, cover imports) is not needed until something is playing, and this
// provider wraps every page, so it is loaded on demand instead of living in the entry chunk.
let publishedEpisodes: Promise<PodcastEpisode[]> | null = null;
const loadPublishedEpisodes = (): Promise<PodcastEpisode[]> => {
  publishedEpisodes ??= import("@/data/podcast").then((m) => m.publishedPodcastEpisodes.slice().sort((a, b) => a.id - b.id));
  return publishedEpisodes;
};
import { useMembership } from "@/hooks/use-membership";
import { canPlayPodcastEpisode, recordPodcastPlay } from "@/lib/access-quotas";
import { useAuth } from "@/hooks/use-auth";
import { getSavedPosition, readPositions, saveLocalPosition, syncProgressToAccount } from "@/lib/pwa/playbackProgress";
import { getDownloadedObjectUrl, isDownloaded, loadDownloads } from "@/lib/pwa/podcastCache";
import { trackPwaEvent } from "@/lib/pwa/analytics";
import {
  SEEK_SECONDS,
  bindMediaSessionHandlers,
  setMediaMetadata,
  setPlaybackState,
  setPositionState,
} from "@/lib/pwa/mediaSession";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
/** Resume positions are written locally at most this often while playing (and always on pause/end/hide). */
const POSITION_SAVE_INTERVAL_MS = 2000;

interface PlayerContextValue {
  current: PodcastEpisode | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  speed: number;
  playEpisode: (episode: PodcastEpisode, startSeconds?: number) => void;
  toggle: () => void;
  close: () => void;
  skip: (delta: number) => void;
  cycleSpeed: () => void;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePodcastPlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePodcastPlayer must be used inside PodcastPlayerProvider");
  return ctx;
};

/** Saved resume position for an episode, in seconds, or undefined if never played. */
export { getSavedPosition };

export const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const PodcastPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { isMember } = useMembership();
  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const currentRef = useRef<PodcastEpisode | null>(null);
  currentRef.current = current;
  const blobUrlRef = useRef<string | null>(null);
  const lastSaveAt = useRef(0);
  const lastPositionStateAt = useRef(0);

  // Knows which episodes are downloaded before the first play (isDownloaded is synchronous).
  useEffect(() => {
    void loadDownloads();
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const playEpisode = useCallback(
    (episode: PodcastEpisode, startSeconds?: number) => {
      if (episode.comingSoon || !episode.audioFile) return;
      const audio = audioRef.current;
      if (!audio) return;

      if (!isSignedIn) {
        toast.message("Sign in to stream podcast episodes.", {
          action: { label: "See plans", onClick: () => { window.location.href = "/pricing"; } },
        });
        return;
      }

      // A downloaded episode was already allowed when it was saved, so it stays playable offline.
      if (!isMember && !canPlayPodcastEpisode(episode.slug) && !isDownloaded(episode.slug)) {
        toast.message("You've used this month's free episode. Upgrade for the full library.", {
          action: { label: "See plans", onClick: () => { window.location.href = "/pricing"; } },
        });
        return;
      }

      const isSame = currentRef.current?.id === episode.id;
      const target = startSeconds ?? (isSame ? undefined : readPositions()[episode.slug] ?? 0);
      const begin = () => {
        audio.playbackRate = speed;
        void audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      };
      if (!isSame) {
        const downloaded = isDownloaded(episode.slug);
        // The service worker serves downloads (with Range support). Where it isn't controlling the page
        // (first load after install, unsupported browsers) play the cached bytes through a blob: URL instead.
        const needsBlob = downloaded && typeof navigator !== "undefined" && !navigator.serviceWorker?.controller;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        audio.src = episode.audioFile;
        audio.currentTime = target ?? 0;
        setCurrent(episode);
        setProgress(target ?? 0);
        if (!isMember) recordPodcastPlay(episode.slug);
        if (downloaded) trackPwaEvent("podcast_offline_play", { episode: episode.slug, online: typeof navigator === "undefined" ? true : navigator.onLine });
        if (needsBlob) {
          void getDownloadedObjectUrl(episode.slug).then((url) => {
            if (url && currentRef.current?.id === episode.id) {
              blobUrlRef.current = url;
              audio.src = url;
              audio.currentTime = target ?? 0;
            }
            begin();
          });
          return;
        }
      } else if (target !== undefined) {
        audio.currentTime = target;
        setProgress(target);
      }
      begin();
    },
    [isMember, isSignedIn, speed],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (audio.paused) {
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrent(null);
    setProgress(0);
    setDuration(0);
  }, []);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + delta));
    audio.currentTime = next;
    setProgress(next);
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.duration || Infinity, seconds));
    audio.currentTime = next;
    setProgress(next);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const next = SPEEDS[(SPEEDS.indexOf(prev) + 1) % SPEEDS.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const persist = (force: boolean) => {
      const ep = currentRef.current;
      if (!ep || !isSignedIn || !Number.isFinite(audio.currentTime)) return;
      const now = Date.now();
      if (!force && now - lastSaveAt.current < POSITION_SAVE_INTERVAL_MS) return;
      lastSaveAt.current = now;
      saveLocalPosition(ep.slug, audio.currentTime, now);
      // Account sync (offline writes queue and replay in order; the server keeps the newest timestamp).
      if (user) void syncProgressToAccount(user.id, ep.slug, audio.currentTime, audio.duration || null, force);
    };

    const onTime = () => {
      setProgress(audio.currentTime);
      persist(false);
      const now = performance.now();
      if (now - lastPositionStateAt.current > 1000) {
        lastPositionStateAt.current = now;
        setPositionState(audio.duration, audio.currentTime, audio.playbackRate);
      }
    };

    const onMeta = () => {
      setDuration(audio.duration || 0);
      setPositionState(audio.duration, audio.currentTime, audio.playbackRate);
    };
    // Keep UI state honest when the OS pauses/resumes (headset unplug, lock-screen, another app taking audio).
    const onPause = () => {
      setIsPlaying(false);
      persist(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onHide = () => {
      if (document.visibilityState === "hidden") persist(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      persist(true);
      const ep = currentRef.current;
      if (!ep || !isMember) return;
      void loadPublishedEpisodes().then((ordered) => {
        const idx = ordered.findIndex((e) => e.id === ep.id);
        if (idx >= 0 && idx < ordered.length - 1) {
          const next = ordered[idx + 1];
          if (next?.audioFile) setTimeout(() => playEpisode(next, 0), 400);
        }
      });
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [isMember, isSignedIn, playEpisode, user]);

  // Media Session: now-playing metadata + lock-screen / headset / Bluetooth controls (feature-detected).
  const [orderedEpisodes, setOrderedEpisodes] = useState<PodcastEpisode[]>([]);
  useEffect(() => {
    if (!current) return;
    let active = true;
    void loadPublishedEpisodes().then((eps) => {
      if (active) setOrderedEpisodes(eps);
    });
    return () => {
      active = false;
    };
  }, [current]);
  const currentIndex = current ? orderedEpisodes.findIndex((e) => e.id === current.id) : -1;
  const previousEpisode = currentIndex > 0 ? orderedEpisodes[currentIndex - 1] : null;
  const upNext = currentIndex >= 0 ? orderedEpisodes[currentIndex + 1] ?? null : null;

  useEffect(() => {
    setMediaMetadata(current ? { title: current.title, image: current.image } : null);
  }, [current]);

  useEffect(() => {
    setPlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (!current) return;
    return bindMediaSessionHandlers({
      play: () => {
        const audio = audioRef.current;
        if (audio?.paused) toggle();
      },
      pause: () => {
        const audio = audioRef.current;
        if (audio && !audio.paused) toggle();
      },
      seekBy: (delta) => skip(delta || SEEK_SECONDS),
      seekTo: (seconds) => seek(seconds),
      // Back: restart the episode if we're past the first few seconds, else go to the previous one.
      previous: () => {
        const audio = audioRef.current;
        if (audio && (audio.currentTime > 5 || !previousEpisode)) seek(0);
        else if (previousEpisode) playEpisode(previousEpisode, 0);
      },
      next: upNext ? () => playEpisode(upNext, 0) : null,
      stop: close,
    });
  }, [current, previousEpisode, upNext, toggle, skip, seek, playEpisode, close]);

  const value = useMemo(
    () => ({ current, isPlaying, progress, duration, speed, playEpisode, toggle, close, skip, cycleSpeed, seek }),
    [current, isPlaying, progress, duration, speed, playEpisode, toggle, close, skip, cycleSpeed, seek],
  );

  const nextEpisode = current ? orderedEpisodes.find((e) => e.id > current.id) : null;

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
      <AnimatePresence>
        {current && (
          <m.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-2xl"
          >
            <div className="container mx-auto flex items-center gap-3 px-4 py-3 md:gap-5 md:px-6 md:py-4">
              <Link to={`/podcast/${current.slug}`} className="shrink-0">
                <img
                  src={current.image}
                  alt={current.title}
                  className="h-14 w-14 rounded-xl object-cover shadow-lg ring-1 ring-border transition-transform hover:scale-105 md:h-16 md:w-16"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/podcast/${current.slug}`} title={current.title} className="flex min-w-0 max-w-full items-center gap-1.5 text-sm font-semibold text-foreground hover:underline">
                  <span className="min-w-0 truncate">{current.title}</span>
                  {!isMember && isSignedIn && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                      Free monthly episode
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">{formatTime(progress)}</span>
                  <Slider
                    value={[duration ? (progress / duration) * 100 : 0]}
                    onValueChange={([v]) => { if (duration) seek((v / 100) * duration); }}
                    className="flex-1 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-foreground [&_[role=slider]]:shadow-md"
                    aria-label="Seek"
                  />
                  <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => skip(-15)} aria-label="Back 15 seconds" className="rounded-full p-2.5 transition-all hover:bg-muted hover:text-foreground">
                  <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl md:h-12 md:w-12">
                  {isPlaying ? <Pause className="h-5 w-5 md:h-6 md:w-6" /> : <Play className="h-5 w-5 md:h-6 md:w-6" />}
                </button>
                <button onClick={() => skip(15)} aria-label="Forward 15 seconds" className="rounded-full p-2.5 transition-all hover:bg-muted hover:text-foreground">
                  <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button onClick={cycleSpeed} aria-label="Playback speed" className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-muted sm:flex">
                  <Gauge className="h-3.5 w-3.5" />
                  {speed}x
                </button>
                {nextEpisode && isMember && (
                  <button onClick={() => playEpisode(nextEpisode, 0)} className="hidden rounded-lg bg-muted px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted/80 lg:block">
                    Next up
                  </button>
                )}
                <button onClick={close} aria-label="Close player" className="rounded-full p-2 transition-all hover:bg-destructive/10 hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
};
