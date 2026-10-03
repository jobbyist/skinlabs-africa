import { useEffect, useRef, useState } from "react";
import { CheckCircle2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { trackPwaEvent } from "@/lib/pwa/analytics";

const BACK_ONLINE_MS = 3000;

/**
 * Subtle connectivity pill, anchored above the floating bottom nav / podcast
 * mini-player and clear of the home-indicator safe area. It says "You're
 * offline" while offline and a brief "Back online" when connectivity returns
 * (confirmed by a real reachability probe, not just the `online` event).
 */
const OfflineBanner = () => {
  const { isOffline } = useNetworkStatus();
  const { current } = usePodcastPlayer();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOffline) {
      if (!wasOffline.current) trackPwaEvent("pwa_offline");
      wasOffline.current = true;
      setShowBackOnline(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    trackPwaEvent("pwa_online");
    setShowBackOnline(true);
    const timer = window.setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    return () => window.clearTimeout(timer);
  }, [isOffline]);

  if (!isOffline && !showBackOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[58] flex justify-center px-4 transition-[bottom] duration-300 ease-out",
        current ? "bottom-[calc(env(safe-area-inset-bottom)+10.5rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+6.25rem)]",
        "sm:bottom-[calc(env(safe-area-inset-bottom)+2rem)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2",
          isOffline ? "border-border bg-background/95" : "border-primary/30 bg-background/95",
        )}
      >
        {isOffline ? (
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        )}
        <div className="text-sm">
          <p className="font-semibold leading-tight">{isOffline ? "You’re offline" : "Back online"}</p>
          {isOffline && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Some SkinLabs® features may be unavailable, but your saved content is still here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
