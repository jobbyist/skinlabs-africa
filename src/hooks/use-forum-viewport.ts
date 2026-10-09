import { useEffect, useRef } from "react";

/** One owner of sheet geometry; Vaul's input repositioning must be disabled. */
export function useForumViewport(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const viewport = window.visualViewport;
    if (!open || !element || !viewport) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Don't treat pinch zoom as a keyboard, or interfere with accessible zoom.
      if (Math.abs(viewport.scale - 1) > 0.01) return;
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      element.style.setProperty("--forum-viewport-height", `${Math.round(viewport.height)}px`);
      element.style.setProperty("--forum-viewport-bottom", `${Math.round(bottom)}px`);
      element.dataset.keyboardOpen = bottom > 80 ? "true" : "false";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      element.style.removeProperty("--forum-viewport-height");
      element.style.removeProperty("--forum-viewport-bottom");
      delete element.dataset.keyboardOpen;
    };
  }, [open]);

  return ref;
}