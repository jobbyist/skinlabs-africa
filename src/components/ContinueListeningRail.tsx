import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { usePodcastPlayer, formatTime, getSavedPosition } from "@/components/PodcastPlayer";
import { publishedPodcastEpisodes, type PodcastEpisode } from "@/data/podcast";

/**
 * Prominent "pick up where you left off" card for a signed-in listener with
 * an in-progress episode. The play/like/share hooks already track this via
 * localStorage (getSavedPosition) — this just surfaces it more visibly than
 * the small text hint on each hub card.
 */
const ContinueListeningRail = () => {
  const { playEpisode, current } = usePodcastPlayer();
  const [inProgress, setInProgress] = useState<{ episode: PodcastEpisode; seconds: number } | null>(null);

  useEffect(() => {
    // Newest episodes first — a reasonable proxy for "most recently started"
    // since there's no separate last-played timestamp tracked.
    const candidates = [...publishedPodcastEpisodes].sort((a, b) => b.id - a.id);
    for (const episode of candidates) {
      const saved = getSavedPosition(episode.slug);
      const total = episode.durationSeconds ?? 0;
      const isMeaningfullyStarted = saved && saved > 15;
      const isNotFinished = !total || saved! < total - 10;
      if (isMeaningfullyStarted && isNotFinished) {
        setInProgress({ episode, seconds: saved! });
        return;
      }
    }
    setInProgress(null);
  }, []);

  if (!inProgress || current?.slug === inProgress.episode.slug) return null;

  const { episode, seconds } = inProgress;

  return (
    <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <img
        src={episode.image}
        alt={`${episode.title} cover art`}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Continue listening</p>
        <Link to={`/podcast/${episode.slug}`} className="truncate text-sm font-semibold text-foreground hover:underline">
          {episode.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatTime(seconds)} of {episode.duration}
        </p>
      </div>
      <button
        type="button"
        onClick={() => playEpisode(episode, seconds)}
        aria-label={`Resume ${episode.title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
      >
        <Play className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
};

export default ContinueListeningRail;
