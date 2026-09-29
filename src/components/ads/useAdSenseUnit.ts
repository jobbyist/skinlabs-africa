import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ADSENSE_CLIENT = "ca-pub-1237323355260727";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
// How long to wait for AdSense to process a slot before treating it as blocked.
const PROCESS_TIMEOUT_MS = 6000;

/** index.html loads the script; the SSR route shells don't, so make sure it's present exactly once. */
const ensureAdSenseScript = () => {
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = ADSENSE_SCRIPT_SRC;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
};

/**
 * Requests an ad for one <ins class="adsbygoogle"> and reports whether the
 * slot should collapse: AdSense marks a slot it can't fill with
 * data-ad-status="unfilled", and a blocked script never marks it processed at
 * all. Either way the reserved box would otherwise sit on the page as an
 * empty gap between content blocks.
 */
export const useAdSenseUnit = () => {
  const insRef = useRef<HTMLModElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;

    if (!ins.getAttribute("data-adsbygoogle-status")) {
      try {
        ensureAdSenseScript();
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Blocked or already-initialised slot — the timeout below decides visibility.
      }
    }

    const collapseIfUnfilled = () => {
      if (ins.getAttribute("data-ad-status") === "unfilled") setCollapsed(true);
    };
    collapseIfUnfilled();
    const observer = new MutationObserver(collapseIfUnfilled);
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    const timeout = window.setTimeout(() => {
      if (!ins.getAttribute("data-adsbygoogle-status")) setCollapsed(true);
    }, PROCESS_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return { insRef, collapsed };
};
