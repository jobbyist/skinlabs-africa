import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { shouldShowBackToTop } from "@/lib/scrollMemory";
import { usePodcastPlayer } from "@/components/PodcastPlayer";

const HIDDEN_PREFIXES = ["/skynn-ai/advanced", "/giveaways", "/marketplace", "/brand-ambassadors"];

/**
 * Featherweight circular "Back to top". The ring is the reading progress (the header bar's twin), so one glance says how
 * far down you are. Sits above the floating bottom nav / podcast mini-player; glides up (instantly for reduced motion).
 */
const BackToTop = () => {
  const { pathname } = useLocation();
  const { current: episode } = usePodcastPlayer();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const { scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      setVisible(shouldShowBackToTop(window.scrollY, window.innerHeight));
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const goTop = () => {
    haptic();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  };
  const C = 2 * Math.PI * 18;

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "fixed right-4 z-[45] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-md",
        "transition-[opacity,transform,bottom] duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation",
        episode ? "bottom-[calc(env(safe-area-inset-bottom)+11rem)]" : "bottom-[calc(env(safe-area-inset-bottom)+6.5rem)]",
        "sm:bottom-8 sm:right-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="url(#btt-grad)" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
        <defs>
          <linearGradient id="btt-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" /><stop offset="35%" stopColor="#3b82f6" /><stop offset="70%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <ArrowUp className="relative h-4 w-4" aria-hidden="true" />
    </button>
  );
};

export default BackToTop;
