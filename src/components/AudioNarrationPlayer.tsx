import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioNarrationPlayerProps {
  label: string;
  text: string;
  supportingText?: string;
}

const AudioNarrationPlayer = ({ label, text, supportingText }: AudioNarrationPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const startPlayback = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {supportingText ?? "Tap play to hear the narrated overview."}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={isPlaying ? stopPlayback : startPlayback}
          disabled={!isSupported}
          aria-label={isPlaying ? "Stop audio narration" : "Play audio narration"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all",
              isPlaying ? "w-full animate-pulse" : "w-0",
            )}
          />
        </div>
        <Volume2 className={cn("h-4 w-4", isPlaying ? "text-primary" : "text-muted-foreground")} />
      </div>
      {!isSupported && (
        <p className="mt-2 text-xs text-muted-foreground">
          Audio narration is not supported in this browser.
        </p>
      )}
    </div>
  );
};

export default AudioNarrationPlayer;
