import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import type { PodcastEpisode } from "@/data/podcast";
import { trackEvent } from "@/lib/analytics";

interface AudioContextValue {
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
  seekToPercent: (percent: number) => void;
}

const PlayerContext = createContext<AudioContextValue | null>(null);

/** Read the shared audio player state — must be used inside <AudioProvider>. */
export const useAudio = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
};

export const SPEEDS = [1, 1.25, 1.5, 2];
const POSITION_KEY = "skinlabs-podcast-positions";

const readPositions = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(POSITION_KEY) || "{}");
  } catch {
    return {};
  }
};

export const formatDuration = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Owns the single <audio> element for the whole app so playback survives
 * route changes — mounted once at the App root, above the router. The
 * presentational sticky bar lives in components/PodcastPlayer.tsx and reads
 * everything it needs from useAudio().
 */
export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const playEpisode = useCallback((episode: PodcastEpisode, startSeconds?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const isSame = current?.id === episode.id;
    if (!isSame) {
      audio.src = episode.audioFile;
      const saved = readPositions()[episode.slug] ?? 0;
      audio.currentTime = startSeconds ?? saved;
      setCurrent(episode);
    } else if (startSeconds !== undefined) {
      audio.currentTime = startSeconds;
    }
    audio.playbackRate = speed;
    if (!isSame) trackEvent("podcast_played", { episode_slug: episode.slug, episode_title: episode.title });
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [current, speed]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.max(0, audio.currentTime + delta);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const next = SPEEDS[(SPEEDS.indexOf(prev) + 1) % SPEEDS.length];
      return next;
    });
  }, []);

  // Apply playback rate separately when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const seekToPercent = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (audio && duration) audio.currentTime = (percent / 100) * duration;
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 2000; // Persist to localStorage every 2 seconds

    const onTime = () => {
      setProgress(audio.currentTime);
      const now = Date.now();
      if (current && now - lastSaveTime >= SAVE_INTERVAL) {
        lastSaveTime = now;
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
      // Flush the latest position on cleanup before removing listeners
      if (current && audio.currentTime > 0) {
        const positions = readPositions();
        positions[current.slug] = audio.currentTime;
        localStorage.setItem(POSITION_KEY, JSON.stringify(positions));
      }
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [current]);

  const value = useMemo(
    () => ({ current, isPlaying, progress, duration, speed, playEpisode, toggle, close, skip, cycleSpeed, seekToPercent }),
    [current, isPlaying, progress, duration, speed, playEpisode, toggle, close, skip, cycleSpeed, seekToPercent],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
};
