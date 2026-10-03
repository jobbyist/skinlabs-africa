import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const TOP_ZONE_PX = 8;
const JITTER_PX = 4;

/**
 * Mobile-only "hide on scroll down, reveal on scroll up" signal. Always
 * revealed at the top of the page; always false at md and up (the surfaces
 * that use it are phone chrome). `enabled: false` also reports false, so a
 * caller can keep one hook call and let a route rule switch it off.
 */
export const useScrollReveal = (enabled = true): boolean => {
  const [revealed, setRevealed] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      return;
    }
    const media = window.matchMedia(MOBILE_QUERY);
    let lastY = window.scrollY;
    const sync = () => setRevealed(media.matches && window.scrollY <= TOP_ZONE_PX);
    sync();

    const onScroll = () => {
      const y = window.scrollY;
      if (!media.matches) setRevealed(false);
      else if (y <= TOP_ZONE_PX) setRevealed(true);
      else if (y > lastY + JITTER_PX) setRevealed(false);
      else if (y < lastY - JITTER_PX) setRevealed(true);
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener?.("change", sync);
    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  return revealed;
};
