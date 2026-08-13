import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, X, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useAudio, formatDuration } from "@/context/AudioContext";
import { podcastEpisodes } from "@/data/podcast";

/** Sticky, always-on-top playback bar. Reads all state from AudioContext. */
const PodcastPlayer = () => {
  const { current, isPlaying, progress, duration, speed, toggle, close, skip, cycleSpeed, seekToPercent, playEpisode } =
    useAudio();
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const nextEpisode = current
    ? podcastEpisodes[(podcastEpisodes.findIndex((e) => e.id === current.id) + 1) % podcastEpisodes.length]
    : null;

  const sliderValue = dragging ? dragValue : (duration ? (progress / duration) * 100 : 0);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black text-white"
        >
          <div className="container mx-auto flex items-center gap-3 px-3 py-2 md:gap-4 md:px-4 md:py-3">
            <Link
              to={`/podcast/${current.slug}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 md:h-12 md:w-12"
            >
              <img src={current.image} alt={current.title} className="h-full w-full object-contain" />
            </Link>

            <div className="min-w-0 flex-1">
              <Link to={`/podcast/${current.slug}`} className="block truncate text-sm font-semibold text-white hover:underline">
                {current.title}
              </Link>
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] tabular-nums text-white/60 sm:inline">{formatDuration(progress)}</span>
                <Slider
                  value={[sliderValue]}
                  onValueChange={([v]) => {
                    setDragging(true);
                    setDragValue(v);
                  }}
                  onValueCommit={([v]) => {
                    seekToPercent(v);
                    setDragging(false);
                  }}
                  className="flex-1"
                  aria-label="Seek"
                />
                <span className="hidden text-[11px] tabular-nums text-white/60 sm:inline">{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds" className="rounded-full p-2 hover:bg-white/10">
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => skip(15)} aria-label="Forward 15 seconds" className="rounded-full p-2 hover:bg-white/10">
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label="Playback speed"
                className="hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-white/10 sm:flex"
              >
                <Gauge className="h-3.5 w-3.5" />
                {speed}x
              </button>
              {nextEpisode && (
                <button
                  type="button"
                  onClick={() => playEpisode(nextEpisode, 0)}
                  className="hidden rounded-full px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/10 lg:block"
                >
                  Next up
                </button>
              )}
              <button type="button" onClick={close} aria-label="Close player" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PodcastPlayer;
