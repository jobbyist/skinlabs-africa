import { Heart, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePodcastEngagement } from "@/hooks/use-podcast-engagement";
import type { PodcastEpisode } from "@/data/podcast";
import { SITE_URL } from "@/lib/seo-config";

interface PodcastEngagementBarProps {
  episode: PodcastEpisode;
  onPlay?: () => void;
}

/**
 * Persistent play/like/share bar for a single episode page. Counts are the
 * same seed-plus-live-increment model used on the podcast hub cards
 * (usePodcastEngagement), so they stay consistent across the site and survive
 * reloads via localStorage + best-effort Supabase sync.
 */
const PodcastEngagementBar = ({ episode, onPlay }: PodcastEngagementBarProps) => {
  const { isAuthenticated, getPlays, getLikes, getShares, isLiked, recordPlay, toggleLike, recordShare } =
    usePodcastEngagement([episode]);

  const handlePlay = () => {
    void recordPlay(episode);
    onPlay?.();
  };

  const handleShare = async () => {
    const shareData = {
      title: episode.title,
      text: episode.description,
      url: `${SITE_URL}/podcast/${episode.slug}`,
    };
    void recordShare(episode);
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Episode link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <Button size="sm" className="gap-2" onClick={handlePlay}>
        <Play className="h-4 w-4" /> Play
      </Button>
      <span className="text-sm tabular-nums text-muted-foreground">{getPlays(episode).toLocaleString()} plays</span>

      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => void toggleLike(episode)}
        disabled={!isAuthenticated}
        title={isAuthenticated ? undefined : "Sign in to like this episode"}
      >
        <Heart className={`h-4 w-4 ${isLiked(episode.slug) ? "fill-foreground text-foreground" : ""}`} />
        {getLikes(episode).toLocaleString()}
      </Button>

      <Button variant="outline" size="sm" className="gap-2" onClick={() => void handleShare()}>
        <Share2 className="h-4 w-4" />
        {getShares(episode).toLocaleString()}
      </Button>
    </div>
  );
};

export default PodcastEngagementBar;
