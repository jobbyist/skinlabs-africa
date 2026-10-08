import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { recallScroll, rememberScroll, resolveScrollIntent } from "@/lib/scrollMemory";

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Runs `attempt` every frame until it reports done or the budget runs out (late-loading content, lazy routes). */
const retryUntil = (attempt: () => boolean, budgetMs: number) => {
  const started = performance.now();
  let raf = 0;
  const tick = () => {
    if (attempt() || performance.now() - started > budgetMs) return;
    raf = window.requestAnimationFrame(tick);
  };
  tick();
  return () => window.cancelAnimationFrame(raf);
};

/**
 * Replaces the old always-scroll-to-top. On a new page: top (instantly, so the CSS smooth-scroll never animates a page
 * change). On Back/Forward: the exact remembered position, waiting for the feed to be tall enough. With a #hash:
 * a smooth glide to that element (instant for reduced-motion), also after lazy content mounts.
 */
const ScrollManager = () => {
  const { pathname, hash, key } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Remember where each history entry was last scrolled to. Positions are captured BEFORE a navigation changes the page
  // (a link click, popstate) or while scrolling: reading scrollY after the new route mounts would catch the browser's
  // clamping to the new, shorter page.
  const keyRef = useRef(key);
  useLayoutEffect(() => {
    keyRef.current = key;
  }, [key]);
  useEffect(() => {
    let timer: number | undefined;
    const save = () => rememberScroll(keyRef.current, window.scrollY);
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 120);
    };
    let jumpTimer: number | undefined;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      save();
      // A same-page #anchor: let the browser jump natively, but smoothly (see index.css).
      if (link.hash && link.origin === window.location.origin && link.pathname === window.location.pathname) {
        document.documentElement.dataset.anchorJump = "1";
        window.clearTimeout(jumpTimer);
        jumpTimer = window.setTimeout(() => delete document.documentElement.dataset.anchorJump, 1200);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", save);
    window.addEventListener("pagehide", save);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timer);
      window.clearTimeout(jumpTimer);
    };
  }, []);

  useLayoutEffect(() => {
    const intent = resolveScrollIntent({ navType, hash, remembered: recallScroll(keyRef.current) });
    if (intent.type === "top") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    if (intent.type === "restore") {
      // Late-loading ads/images can shift the page after we land: hold the target for a moment unless the visitor starts scrolling.
      let touched = false;
      const stop = () => { touched = true; };
      const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
      events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
      let cancelHold: () => void = () => undefined;
      const cancelWait = retryUntil(() => {
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: Math.min(intent.y, Math.max(0, maxY)), left: 0, behavior: "instant" });
        if (maxY < intent.y - 2) return false;
        const holdUntil = performance.now() + 900;
        cancelHold = retryUntil(() => {
          if (touched) return true;
          if (Math.abs(window.scrollY - intent.y) > 2) window.scrollTo({ top: intent.y, left: 0, behavior: "instant" });
          return performance.now() > holdUntil;
        }, 1000);
        return true;
      }, 3000);
      return () => {
        cancelWait();
        cancelHold();
        events.forEach((e) => window.removeEventListener(e, stop));
      };
    }
    // #hash deep link: the element may mount after a lazy chunk / query resolves.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return retryUntil(() => {
      const el = document.getElementById(intent.id);
      if (!el) return false;
      el.scrollIntoView({ behavior: reduced() ? "instant" : "smooth", block: "start" });
      return true;
    }, 4000);
    // pathname/hash identify a page change. NOT `key`: search-only changes (quiz steps, filters, tabs) get a new key too and must never move the page.
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollManager;
