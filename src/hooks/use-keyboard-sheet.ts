import { useEffect, useState } from "react";
import { sheetMetrics, type SheetMetrics } from "@/lib/community/viewport";

const CLOSED: SheetMetrics = { bottom: 0, maxHeight: null, keyboardOpen: false };

/**
 * Tracks `window.visualViewport` so a bottom sheet can float directly above the software keyboard. Updates are coalesced into one
 * animation frame (resize and scroll events fire in bursts while the keyboard animates) and ignored when nothing changed,
 * which is what keeps the composer from jittering.
 */
export const useKeyboardSheet = (active: boolean): SheetMetrics => {
  const [metrics, setMetrics] = useState<SheetMetrics>(CLOSED);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) {
      setMetrics(CLOSED);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const next = sheetMetrics(window.innerHeight, vv);
      setMetrics((prev) => (prev.bottom === next.bottom && prev.maxHeight === next.maxHeight && prev.keyboardOpen === next.keyboardOpen ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, [active]);
  return metrics;
};
