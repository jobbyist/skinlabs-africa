import { Link } from "react-router-dom";
import { Play, Clock, Lock, SkipBack, SkipForward } from "lucide-react";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { publishedPodcastEpisodes } from "@/data/podcast";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { supabase } from "@/integrations/supabase/client";

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
  const { playEpisode, current, isPlaying, toggle } = usePodcastPlayer();
  const { user } = useAuth();
  const { isMember } = useMembership();

  const handlePlayEpisode = async (episode: (typeof publishedPodcastEpisodes)[0]) => {
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (supabase as any).from("podcast_plays").insert({
        user_id: user.id,
        episode_slug: episode.slug,
        episode_title: episode.title,
      });
    }
    playEpisode(episode);
  };

  const list = limit ? publishedPodcastEpisodes.slice(0, limit) : publishedPodcastEpisodes;

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
                  {/* Monochrome-style embedded player bar */}
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => (isCurrent ? toggle() : handlePlayEpisode(episode))}
                        aria-label={
                          !isMember
                            ? `Play ${episode.title} (2-minute preview)`
                            : isCurrent && isPlaying
                              ? `Pause ${episode.title}`
                              : `Play ${episode.title}`
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full w-0 rounded-full bg-foreground/40" />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                          <span>0:00</span>
                          <span>{episode.duration.replace(" min", ":00")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-center gap-4 text-[10px] font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <SkipBack className="h-3 w-3" /> 15 SEC
                      </span>
                      <span>1x SPEED</span>
                      <span className="inline-flex items-center gap-0.5">
                        15 SEC <SkipForward className="h-3 w-3" />
                      </span>
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
