import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioNarrationPlayerProps {
  label: string;
  text?: string;
  audioSrc?: string;
  supportingText?: string;
}

const AudioNarrationPlayer = ({ label, text, audioSrc, supportingText }: AudioNarrationPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use audio file if provided, otherwise fallback to text narration
  const useAudioFile = !!audioSrc;

  useEffect(() => {
    if (!useAudioFile) {
      setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, [useAudioFile]);

  const stopPlayback = () => {
    if (useAudioFile && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const startPlayback = () => {
    if (useAudioFile && audioSrc) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.addEventListener("timeupdate", () => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        });
        audioRef.current.addEventListener("loadedmetadata", () => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        });
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
        audioRef.current.addEventListener("error", () => {
          setIsPlaying(false);
        });
      }
      audioRef.current.play();
      setIsPlaying(true);
    } else if (text) {
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
    }
  };

  const togglePlayback = () => {
    if (useAudioFile && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const progress = useAudioFile && duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {supportingText ?? (useAudioFile ? "Tap play to listen to the audio." : "Tap play to hear the narrated overview.")}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          disabled={!useAudioFile && !isSupported}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all",
              useAudioFile ? "" : isPlaying ? "animate-pulse" : "",
            )}
            style={useAudioFile ? { width: `${progress}%` } : { width: isPlaying ? "100%" : "0%" }}
          />
        </div>
        <Volume2 className={cn("h-4 w-4", isPlaying ? "text-primary" : "text-muted-foreground")} />
      </div>
      {!useAudioFile && !isSupported && (
        <p className="mt-2 text-xs text-muted-foreground">
          Audio narration is not supported in this browser.
        </p>
      )}
    </div>
  );
};

export default AudioNarrationPlayer;
