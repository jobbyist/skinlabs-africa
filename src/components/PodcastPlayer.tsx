import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, X, Gauge, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { publishedPodcastEpisodes, type PodcastEpisode } from "@/data/podcast";
import { useMembership } from "@/hooks/use-membership";

/** Free-tier episode preview cap, in seconds. */
const PREVIEW_LIMIT_SECONDS = 120;

interface PlayerContextValue {
  current: PodcastEpisode | null;
  isPlaying: boolean;
  playEpisode: (episode: PodcastEpisode, startSeconds?: number) => void;
  toggle: () => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePodcastPlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePodcastPlayer must be used inside PodcastPlayerProvider");
  return ctx;
};

const SPEEDS = [1, 1.25, 1.5, 2];
const POSITION_KEY = "skinlabs-podcast-positions";

const readPositions = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(POSITION_KEY) || "{}");
  } catch {
    return {};
  }
};

const format = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const PodcastPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { isMember } = useMembership();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const playEpisode = useCallback(
    (episode: PodcastEpisode, startSeconds?: number) => {
      if (episode.comingSoon || !episode.audioFile) return;
      const audio = audioRef.current;
      if (!audio) return;
      const isSame = current?.id === episode.id;
      let target = startSeconds ?? (isSame ? undefined : readPositions()[episode.slug] ?? 0);
      if (!isMember && target !== undefined && target >= PREVIEW_LIMIT_SECONDS) {
        target = 0;
      }
      if (!isSame) {
        audio.src = episode.audioFile;
        audio.currentTime = target ?? 0;
        setCurrent(episode);
      } else if (target !== undefined) {
        audio.currentTime = target;
      }
      audio.playbackRate = speed;
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    },
    [current, isMember, speed],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrent(null);
  }, []);

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.max(0, audio.currentTime + delta);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (!isMember && audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
        audio.pause();
        audio.currentTime = PREVIEW_LIMIT_SECONDS;
        setIsPlaying(false);
        setProgress(PREVIEW_LIMIT_SECONDS);
        toast.message("That's the free preview — become a member to hear the full episode.", {
          action: {
            label: "See plans",
            onClick: () => {
              window.location.href = "/pricing";
            },
          },
        });
        return;
      }
      setProgress(audio.currentTime);
      if (current && isMember) {
        const positions = readPositions();
        positions[current.slug] = audio.currentTime;
        localStorage.setItem(POSITION_KEY, JSON.stringify(positions));
      }
    };
    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [current, isMember]);

  const value = useMemo(
    () => ({ current, isPlaying, playEpisode, toggle, close }),
    [current, isPlaying, playEpisode, toggle, close],
  );

  const nextEpisode = current
    ? publishedPodcastEpisodes[
        (publishedPodcastEpisodes.findIndex((e) => e.id === current.id) + 1) % publishedPodcastEpisodes.length
      ]
    : null;

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl"
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
                <Link
                  to={`/podcast/${current.slug}`}
                  className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground hover:underline"
                >
                  {current.title}
                  {!isMember && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> 2-min preview
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">{format(progress)}</span>
                  <Slider
                    value={[duration ? (progress / duration) * 100 : 0]}
                    onValueChange={([v]) => {
                      if (audioRef.current && duration) audioRef.current.currentTime = (v / 100) * duration;
                    }}
                    className="flex-1 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-foreground [&_[role=slider]]:shadow-md"
                    aria-label="Seek"
                  />
                  <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">{format(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => skip(-15)}
                  aria-label="Back 15 seconds"
                  className="rounded-full p-2.5 transition-all hover:bg-muted hover:text-foreground"
                >
                  <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={toggle}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl md:h-12 md:w-12"
                >
                  {isPlaying ? <Pause className="h-5 w-5 md:h-6 md:w-6" /> : <Play className="h-5 w-5 md:h-6 md:w-6" />}
                </button>
                <button
                  onClick={() => skip(15)}
                  aria-label="Forward 15 seconds"
                  className="rounded-full p-2.5 transition-all hover:bg-muted hover:text-foreground"
                >
                  <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={cycleSpeed}
                  aria-label="Playback speed"
                  className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-muted sm:flex"
                >
                  <Gauge className="h-3.5 w-3.5" />
                  {speed}x
                </button>
                {nextEpisode && (
                  <button
                    onClick={() => playEpisode(nextEpisode, 0)}
                    className="hidden rounded-lg bg-muted px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted/80 lg:block"
                  >
                    Next up
                  </button>
                )}
                <button
                  onClick={close}
                  aria-label="Close player"
                  className="rounded-full p-2 transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
};
