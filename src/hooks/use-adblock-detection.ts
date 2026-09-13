import { useEffect, useState } from "react";

/**
 * Detects common ad blockers by attempting to load a bait element/script pattern
 * that adblockers typically hide or block. Runs once on mount.
 */
export function useAdBlockDetection() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      try {
        // Method 1: bait element with common ad class names
        const bait = document.createElement("div");
        bait.className = "adsbox ad-banner adsbygoogle ad-placement pub_300x250";
        bait.style.cssText =
          "position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none;";
        bait.setAttribute("aria-hidden", "true");
        document.body.appendChild(bait);

        // Allow layout / blocker mutation
        await new Promise((r) => setTimeout(r, 80));

        const blocked =
          bait.offsetParent === null ||
          bait.offsetHeight === 0 ||
          bait.clientHeight === 0 ||
          window.getComputedStyle(bait).display === "none" ||
          window.getComputedStyle(bait).visibility === "hidden";

        bait.remove();

        // Method 2: attempt to fetch a well-known ad script path (often blocked)
        let fetchBlocked = false;
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
            { method: "HEAD", mode: "no-cors", signal: controller.signal },
          );
          clearTimeout(t);
          // no-cors opaque response still means the request left the browser;
          // blockers usually reject/abort entirely.
          void res;
        } catch {
          fetchBlocked = true;
        }

        if (!cancelled) {
          setAdBlockDetected(blocked || fetchBlocked);
          setChecked(true);
        }
      } catch {
        if (!cancelled) {
          setAdBlockDetected(false);
          setChecked(true);
        }
      }
    };

    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return { adBlockDetected, checked };
}
