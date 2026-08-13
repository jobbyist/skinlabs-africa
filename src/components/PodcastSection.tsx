import { Link } from "react-router-dom";
import { Clock, Pause, Play } from "lucide-react";
import { useAudio } from "@/context/AudioContext";
import { podcastEpisodes } from "@/data/podcast";
import { cn } from "@/lib/utils";

interface PodcastSectionProps {
  heading?: string;
  description?: string;
  showCta?: boolean;
}

const PodcastSection = ({
  heading = "The Skin Deep Podcast",
  description = "Weekly audio conversations on skincare culture, ingredient science and mindful routines. Tap play to start listening — it follows you to whatever page you go to next.",
  showCta = true,
}: PodcastSectionProps) => {
  const { current, isPlaying, playEpisode, toggle } = useAudio();

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {podcastEpisodes.slice(0, 4).map((episode) => {
            const isCurrent = current?.id === episode.id;
            return (
              <article
                key={episode.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm",
                  isCurrent ? "border-primary" : "border-border",
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={episode.image}
                    alt={`${episode.title} cover art`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => (isCurrent ? toggle() : playEpisode(episode))}
                    aria-label={isCurrent && isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
                    className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    {isCurrent && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {episode.duration}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{episode.title}</h3>
                  <Link
                    to={`/podcast/${episode.slug}`}
                    className="mt-auto text-xs font-medium text-primary hover:underline"
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
