import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Clock, Lock } from "lucide-react";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { podcastEpisodes } from "@/data/podcast";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [playsThisMonth, setPlaysThisMonth] = useState(0);
  const [loadingPlays, setLoadingPlays] = useState(true);

  useEffect(() => {
    const fetchPlaysThisMonth = async () => {
      if (!user) {
        setLoadingPlays(false);
        return;
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("podcast_plays")
        .select("id")
        .eq("user_id", user.id)
        .gte("played_at", startOfMonth.toISOString());

      if (!error && data) {
        setPlaysThisMonth(data.length);
      }
      setLoadingPlays(false);
    };

    fetchPlaysThisMonth();
  }, [user]);

  const handlePlayEpisode = async (episode: typeof podcastEpisodes[0]) => {
    // Premium members have unlimited access
    if (isMember) {
      playEpisode(episode);
      return;
    }

    // Free users and unauthenticated users limited to 2 per month
    if (!user || playsThisMonth >= 2) {
      toast.error("You've reached your monthly limit of 2 podcast episodes. Upgrade to Glow Insider for unlimited access!", {
        duration: 5000,
        action: {
          label: "Upgrade",
          onClick: () => window.location.href = "/pricing"
        }
      });
      return;
    }

    // Track the play
    if (user) {
      await supabase.from("podcast_plays").insert({
        user_id: user.id,
        episode_slug: episode.slug,
        episode_title: episode.title
      });
      setPlaysThisMonth(prev => prev + 1);
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
        {!isMember && user && !loadingPlays && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full text-sm">
              <span className="text-muted-foreground">
                {playsThisMonth}/2 free episodes used this month
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
                  aria-label={`Play ${episode.title}`}
                  className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 ${
                    !isMember && (!user || playsThisMonth >= 2)
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground"
                  }`}
                  disabled={!isMember && (!user || playsThisMonth >= 2)}
                >
                  {!isMember && (!user || playsThisMonth >= 2) ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
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
