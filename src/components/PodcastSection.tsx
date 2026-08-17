import { Link } from "react-router-dom";
import { Play, Pause } from "lucide-react";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { podcastEpisodes } from "@/data/podcast";
import { cn } from "@/lib/utils";

interface PodcastSectionProps {
  heading?: string;
  description?: string;
  showCta?: boolean;
}

const PodcastSection = ({
  heading = "The Skin Deep Podcast",
  description = "Weekly conversations on skincare culture, ingredient science and mindful routines — grounded in South African skin, climate and shelves. New episode every Wednesday.",
  showCta = true,
}: PodcastSectionProps) => {
  const { playEpisode, toggle, current, isPlaying } = usePodcastPlayer();

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

        <div className="grid gap-8 lg:grid-cols-2">
          {podcastEpisodes.map((episode) => {
            const isCurrent = current?.id === episode.id;
            return (
              <article
                key={episode.id}
                className={cn(
                  "flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm transition-colors",
                  isCurrent ? "border-primary" : "border-border",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-40 sm:w-40">
                    <img
                      src={episode.image}
                      alt={`${episode.title} cover art`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => (isCurrent ? toggle() : playEpisode(episode))}
                      aria-label={isCurrent && isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
                      className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-semibold text-foreground">{episode.title}</h3>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {episode.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {episode.description}
                    </p>
                    <Link
                      to={`/podcast/${episode.slug}`}
                      className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Show notes & transcript →
                    </Link>
                  </div>
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
