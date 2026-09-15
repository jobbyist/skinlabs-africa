import { useEffect, useState } from "react";

/**
 * Thin gradient bar pinned to the header's bottom edge that fills as the
 * visitor scrolls the page — same brand gradient as .gradient-text /
 * .gradient-border-anim, read as a reading-progress affordance rather than
 * a loading indicator. Purely decorative, so it's hidden from screen readers.
 */
const ScrollProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      setProgress(scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden" aria-hidden="true">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%`, backgroundImage: "var(--gradient-brand)" }}
      />
    </div>
  );
};

export default ScrollProgressBar;
