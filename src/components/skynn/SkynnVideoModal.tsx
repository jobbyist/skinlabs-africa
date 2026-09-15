import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { trackConversionEvent } from "@/lib/analytics-events";

interface SkynnVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VIDEO_SRC = "/skynn.mp4";
const POSTER_SRC = "/skynn-video-poster.jpg";

/**
 * Instagram Reel-style "See how it works" preview for SKYNN AI. Fully controlled
 * (open/onOpenChange owned by the caller) to match the existing
 * AnalysisPassPurchaseModal/AuthDialog pattern in AIFormulator.tsx — mounted as a
 * sibling near those, not inline where triggered. The <video> only exists in the
 * DOM while the dialog is open (Radix doesn't render DialogContent until then), so
 * nothing loads or plays before the visitor actually opens it.
 */
const SkynnVideoModal = ({ open, onOpenChange }: SkynnVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const openedTrackedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (open) {
      if (!openedTrackedRef.current) {
        openedTrackedRef.current = true;
        trackConversionEvent("skynn_video_opened", { source: "ai_formulator_intro" });
      }
      if (video) {
        video.currentTime = 0;
        // Muted is set imperatively here (once, when the modal opens) rather than as a
        // React-controlled JSX prop — a plain `muted` attribute gets resynced to true on
        // every re-render of this component (which happens often, since it's a child of
        // AIFormulator and re-renders whenever unrelated parent state changes), silently
        // re-muting the video even after a visitor unmutes it via the native controls.
        // Browser autoplay policy still requires it to start muted, so set that once here.
        video.muted = true;
        const playPromise = video.play();
        if (playPromise) playPromise.catch(() => setShowPlayButton(true));
      }
    } else {
      openedTrackedRef.current = false;
      setShowPlayButton(false);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [open]);

  const handleManualPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setShowPlayButton(false))
      .catch(() => {
        // Still blocked — leave the visible play control up rather than fail silently.
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(92vw,380px)] w-full p-0 gap-0 overflow-hidden rounded-2xl border-0 bg-black motion-reduce:duration-0 [&>button]:z-20 [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button:hover]:bg-black/70 [&>button]:focus:ring-white/70"
      >
        <DialogTitle className="sr-only">SKYNN AI — see how it works</DialogTitle>
        <DialogDescription className="sr-only">
          A short vertical video walking through the SKYNN AI skin assessment.
        </DialogDescription>
        <div className="relative aspect-[9/16] w-full max-h-[calc(100dvh-4rem)] bg-black">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            controls
            preload="auto"
            onPlay={() => setShowPlayButton(false)}
            onEnded={() => trackConversionEvent("skynn_video_completed", { source: "ai_formulator_intro" })}
          >
            Your browser doesn't support embedded video —{" "}
            <a href={VIDEO_SRC} className="underline">
              download the SKYNN AI demo video
            </a>
            .
          </video>
          {showPlayButton && (
            <button
              type="button"
              onClick={handleManualPlay}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Play className="h-7 w-7 text-black ml-1 fill-current" />
              </span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkynnVideoModal;
