import { Link } from "react-router-dom";
import AudioNarrationPlayer from "@/components/AudioNarrationPlayer";
import { podcastEpisodes } from "@/data/podcast";

interface PodcastSectionProps {
  heading?: string;
  description?: string;
  showCta?: boolean;
}

const PodcastSection = ({
  heading = "The Skin Deep Podcast",
  description = "Seven audio-first episodes exploring skincare culture, product science, and mindful routines. Tap play to hear each narration and browse the transcript-ready summaries below.",
  showCta = true,
}: PodcastSectionProps) => {
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
              to="/stream"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Visit the podcast hub
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {podcastEpisodes.map((episode) => (
            <article
              key={episode.id}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <img
                  src={episode.image}
                  alt={episode.title}
                  className="h-40 w-full rounded-2xl object-cover sm:h-32 sm:w-48"
                />
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
                </div>
              </div>
              <AudioNarrationPlayer
                label="Episode audio"
                audioSrc={episode.audioFile}
                text={episode.audioScript}
                supportingText="Listen to this episode."
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
