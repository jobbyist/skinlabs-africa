import { Link } from "react-router-dom";
import { Play, Pause, Clock, Lock, SkipBack, SkipForward, Heart } from "lucide-react";
import { usePodcastPlayer, formatTime } from "@/components/PodcastPlayer";
import { publishedPodcastEpisodes } from "@/data/podcast";
import { useMembership } from "@/hooks/use-membership";
import { usePodcastEngagement } from "@/hooks/use-podcast-engagement";

interface PodcastSectionProps {
  heading?: string;
  description?: string;
  showCta?: boolean;
  limit?: number;
}

const PodcastSection = ({
  heading = "The Skin Deep Podcast",
  description =
    "Skincare without the nonsense. Evidence-first conversations on ingredient science, culture and routines — grounded in South African skin, climate and shelves. New episodes on the last Friday of every month. Coming soon to all major podcast platforms.",
  showCta = true,
  limit,
}: PodcastSectionProps) => {
  const { playEpisode, current, isPlaying, toggle, progress, duration, speed, skip, cycleSpeed, seek } =
    usePodcastPlayer();
  const { isMember } = useMembership();
  const list = limit ? publishedPodcastEpisodes.slice(0, limit) : publishedPodcastEpisodes;
  const { isAuthenticated, getPlays, getLikes, isLiked, recordPlay, toggleLike } = usePodcastEngagement(list);

  const handlePlay = (episode: (typeof publishedPodcastEpisodes)[0]) => {
    void recordPlay(episode);
    if (current?.id === episode.id) toggle();
    else playEpisode(episode);
  };

  return (
    <section id="skin-deep-podcast" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Audio Series</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">{heading}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {showCta && (
            <Link to="/podcast" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              Visit the podcast hub
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        {!isMember && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full text-sm">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Free tier: 2-minute previews ·{" "}
                <Link to="/pricing" className="text-primary hover:underline">
                  Upgrade for full episodes
                </Link>
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((episode) => {
            const isCurrent = current?.id === episode.id;
            const pct = isCurrent && duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
            const timeLeft = isCurrent ? formatTime(progress) : "0:00";
            const timeTotal = isCurrent && duration > 0 ? formatTime(duration) : episode.duration.replace(" min", ":00");

            return (
              <article
                key={episode.id}
                className={`group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-lg ${
                  isCurrent ? "border-foreground/30" : "border-border"
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={episode.image}
                    alt={`${episode.title} cover art`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlay(episode)}
                        aria-label={
                          isCurrent && isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          className="h-1 w-full overflow-hidden rounded-full bg-muted"
                          aria-label="Seek"
                          onClick={(e) => {
                            if (!isCurrent || duration <= 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                            seek(ratio * duration);
                          }}
                        >
                          <div
                            className="h-full rounded-full bg-foreground transition-[width] duration-150"
                            style={{ width: `${pct}%` }}
                          />
                        </button>
                        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                          <span>{timeLeft}</span>
                          <span>{timeTotal}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-center gap-4 text-[10px] font-medium text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => isCurrent && skip(-15)}
                        className="inline-flex items-center gap-0.5 hover:text-foreground disabled:opacity-40"
                        disabled={!isCurrent}
                        aria-label="Back 15 seconds"
                      >
                        <SkipBack className="h-3 w-3" /> 15 SEC
                      </button>
                      <button
                        type="button"
                        onClick={() => isCurrent && cycleSpeed()}
                        className="hover:text-foreground disabled:opacity-40"
                        disabled={!isCurrent}
                        aria-label="Cycle playback speed"
                      >
                        {isCurrent ? `${speed}x` : "1x"} SPEED
                      </button>
                      <button
                        type="button"
                        onClick={() => isCurrent && skip(15)}
                        className="inline-flex items-center gap-0.5 hover:text-foreground disabled:opacity-40"
                        disabled={!isCurrent}
                        aria-label="Forward 15 seconds"
                      >
                        15 SEC <SkipForward className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {episode.duration}
                    </span>
                    {episode.topics.map((item) => (
                      <span key={item} className="rounded-full bg-muted px-2.5 py-0.5">
                        {item}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{episode.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{episode.description}</p>
                  {isAuthenticated && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="tabular-nums">{getPlays(episode).toLocaleString()} plays</span>
                      <button
                        type="button"
                        onClick={() => void toggleLike(episode)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        aria-label={isLiked(episode.slug) ? "Unlike" : "Like"}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isLiked(episode.slug) ? "fill-foreground text-foreground" : ""
                          }`}
                        />
                        {getLikes(episode).toLocaleString()}
                      </button>
                    </div>
                  )}
                  <Link
                    to={`/podcast/${episode.slug}`}
                    className="mt-auto text-sm font-medium text-foreground hover:underline"
                  >
                    Show notes & transcript →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
