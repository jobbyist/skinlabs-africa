import { CheckCircle2, Download, Loader2, Pause, Play, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { PodcastEpisode } from "@/data/podcast";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useOfflinePodcasts } from "@/hooks/use-offline-podcasts";
import { canPlayPodcastEpisode } from "@/lib/access-quotas";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { downloadFailureMessage, downloadProgressPercent, resolveDownloadAccess } from "@/lib/pwa/downloadAccess";
import { formatBytes } from "@/lib/pwa/storage";
import { cancelDownload, pauseDownload, removeDownload, resumeDownload, startDownload } from "@/lib/pwa/podcastCache";

interface Props {
  episode: PodcastEpisode;
  /** "compact" is for cards (icon + short label); "full" adds progress and size detail. */
  size?: "compact" | "full";
  className?: string;
}

/**
 * Save-for-offline control for one episode (the per-episode face of the offline podcast manager).
 * States: Save offline → Downloading n% (pause / cancel) → Paused (resume / cancel) →
 * Available offline (remove) → Failed (message + retry). Renders nothing where downloads aren't
 * supported (no Cache Storage / IndexedDB) or for an episode with no audio yet.
 */
const DownloadEpisodeButton = ({ episode, size = "full", className }: Props) => {
  const { user } = useAuth();
  const { isMember } = useMembership();
  const { supported, bySlug } = useOfflinePodcasts();
  if (!supported || episode.comingSoon || !episode.audioFile) return null;

  const record = bySlug(episode.slug);
  const compact = size === "compact";

  const begin = () => {
    const access = resolveDownloadAccess({ signedIn: Boolean(user), isMember, canPlayFreeEpisode: canPlayPodcastEpisode(episode.slug) });
    if (access === "sign_in") {
      toast.message("Sign in to save episodes for offline listening.");
      openSignupDialog("signin");
      return;
    }
    if (access === "upgrade") {
      toast.message("You’ve used this month’s free episode. Upgrade to save the full library offline.", {
        action: { label: "See plans", onClick: () => { window.location.href = "/pricing"; } },
      });
      return;
    }
    void startDownload({ slug: episode.slug, title: episode.title, audioFile: episode.audioFile, image: episode.image });
  };

  const wrap = `flex flex-col gap-1 ${className ?? ""}`;
  const label = (text: string) => (compact ? <span className="sr-only sm:not-sr-only">{text}</span> : text);

  if (!record) {
    return (
      <div className={wrap}>
        <Button variant="outline" size="sm" className="gap-2" onClick={begin} aria-label={`Save ${episode.title} for offline listening`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {label("Save offline")}
        </Button>
      </div>
    );
  }

  if (record.status === "downloaded") {
    return (
      <div className={wrap}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium" role="status">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Available offline
          </span>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => void removeDownload(episode.slug)} aria-label={`Remove offline download of ${episode.title}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {label("Remove")}
          </Button>
        </div>
        {!compact && <span className="text-xs text-muted-foreground">{formatBytes(record.totalBytes)} on this device</span>}
      </div>
    );
  }

  if (record.status === "downloading" || record.status === "paused") {
    const percent = downloadProgressPercent(record.bytesReceived, record.totalBytes);
    const paused = record.status === "paused";
    return (
      <div className={wrap}>
        <div className="flex items-center gap-2">
          {paused ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => resumeDownload(episode.slug)} aria-label="Resume download">
              <Play className="h-4 w-4" aria-hidden="true" />
              {label("Resume")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => pauseDownload(episode.slug)} aria-label="Pause download">
              <Pause className="h-4 w-4" aria-hidden="true" />
              {label("Pause")}
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground" role="status">
            {!paused && <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />}
            {paused ? "Paused" : "Downloading"} {percent !== null ? `${percent}%` : ""}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void cancelDownload(episode.slug)} aria-label="Cancel download">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {!compact && (
          <Progress value={percent ?? undefined} className="h-1.5" aria-label={`Downloading ${episode.title}`} aria-valuetext={percent !== null ? `${percent} percent` : "In progress"} />
        )}
      </div>
    );
  }

  return (
    <div className={wrap}>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={begin}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {label("Retry download")}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void cancelDownload(episode.slug)} aria-label="Dismiss failed download">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="max-w-xs text-xs text-muted-foreground" role="alert">
        {downloadFailureMessage(record.failure)}
      </p>
    </div>
  );
};

export default DownloadEpisodeButton;
