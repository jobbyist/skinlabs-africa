import { Link } from "react-router-dom";
import { Play, Clock, Lock } from "lucide-react";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { podcastEpisodes } from "@/data/podcast";
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
  description = "Weekly conversations on skincare culture, ingredient science and mindful routines — grounded in South African skin, climate and shelves. New episode every Wednesday.",
  showCta = true,
  limit,
}: PodcastSectionProps) => {
  const { playEpisode, current } = usePodcastPlayer();
  const { user } = useAuth();
  const { isMember } = useMembership();

  // Free tier: every episode is playable, capped to a 2-minute preview by
  // PodcastPlayerProvider itself, so no separate play-count gate is needed here.
  const handlePlayEpisode = async (episode: typeof podcastEpisodes[0]) => {
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- podcast_plays isn't in the generated Supabase types yet
      void (supabase as any).from("podcast_plays").insert({
        user_id: user.id,
        episode_slug: episode.slug,
        episode_title: episode.title,
      });
    }
    playEpisode(episode);
  };

  return (
    <section id="skin-deep-podcast" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Audio Series
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              {heading}
            </h2>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>
          {showCta && (
            <Link
              to="/podcast"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Visit the podcast hub
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        {/* Usage indicator for free users */}
        {!isMember && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full text-sm">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Free tier: 2-minute previews · <Link to="/pricing" className="text-primary hover:underline">Upgrade for full episodes</Link>
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(limit ? podcastEpisodes.slice(0, limit) : podcastEpisodes).map((episode) => (
            <article
              key={episode.id}
              className={`group flex flex-col overflow-hidden rounded-3xl border bg-card transition-all hover:shadow-lg ${
                current?.id === episode.id ? "border-primary" : "border-border"
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={episode.image}
                  alt={`${episode.title} cover art`}
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={() => handlePlayEpisode(episode)}
                  aria-label={!isMember ? `Play ${episode.title} (2-minute preview)` : `Play ${episode.title}`}
                  className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                >
                  <Play className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
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
                <p className="text-sm text-muted-foreground">{episode.description}</p>
                <Link to={`/podcast/${episode.slug}`} className="mt-auto text-sm font-medium text-primary hover:underline">
                  Show notes & transcript →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
