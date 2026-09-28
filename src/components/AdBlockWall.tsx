import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewerContext } from "@/hooks/use-viewer-context";
import { recheckAdBlock } from "@/lib/adBlockDetection";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { trackConversionEvent } from "@/lib/analytics-events";
import { isAutomatedAgent, shouldEnforceAdBlockWall } from "@/lib/viewerContext";

const WALL_ATTR = "data-adblock-wall";

/**
 * Blocks content for ad-supported viewers (visitors, Glow Explorer, Glow
 * Lite) while an ad blocker is on. Replaces the old dismissible notice.
 *
 * - Rules live in shouldEnforceAdBlockWall() (viewerContext.ts): paying
 *   ad-light/ad-free members, crawlers/headless renderers and exempt pages
 *   (pricing, legal, account/billing, auth, admin) never see it.
 * - Content stays in the DOM (SEO, and no cloaking) but is made `inert`, so
 *   it can't be scrolled, focused or clicked while the wall is up.
 * - It sits on the z-[62] tier: above every fixed bar (≤ z-[60]) and below
 *   modals (z-[65]), so AuthDialog can open over it for members signing in.
 * - Detection re-runs on "I've turned it off" and whenever the tab regains
 *   focus, so it lifts as soon as the blocker is paused.
 */
const AdBlockWall = () => {
  useLocation(); // re-evaluate on SPA navigation (exempt pages)
  const viewer = useViewerContext();
  const [checking, setChecking] = useState(false);
  const [stillBlocked, setStillBlocked] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const automated = typeof navigator !== "undefined" && isAutomatedAgent(navigator.userAgent, Boolean(navigator.webdriver));
  const enforce = shouldEnforceAdBlockWall({ adPolicy: viewer.adPolicy, adBlock: viewer.adBlock, pathname, isAutomated: automated });

  useEffect(() => {
    if (!enforce) return;
    const el = document.createElement("div");
    el.setAttribute(WALL_ATTR, "");
    document.body.appendChild(el);
    containerRef.current = el;
    setContainer(el);

    // Everything already on the page becomes inert; dialogs portalled later
    // (AuthDialog for "Sign in") are new body children and stay interactive.
    const blocked = Array.from(document.body.children).filter((node) => node !== el) as HTMLElement[];
    blocked.forEach((node) => {
      node.setAttribute("inert", "");
      node.setAttribute("aria-hidden", "true");
    });
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    trackConversionEvent("adblock_wall_shown");

    return () => {
      blocked.forEach((node) => {
        node.removeAttribute("inert");
        node.removeAttribute("aria-hidden");
      });
      root.style.overflow = prevOverflow;
      el.remove();
      containerRef.current = null;
      setContainer(null);
    };
  }, [enforce]);

  if (!enforce || !container) return null;

  const recheck = async () => {
    setChecking(true);
    const result = await recheckAdBlock();
    setChecking(false);
    setStillBlocked(result === "blocked");
    if (result !== "blocked") trackConversionEvent("adblock_wall_cleared");
  };

  const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-wall-title"
      aria-describedby="adblock-wall-body"
      className="fixed inset-0 z-[62] flex items-end justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-md sm:items-center"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="adblock-wall-title" className="mt-4 font-heading text-xl font-bold text-foreground">
          Turn off your ad blocker to keep reading
        </h2>
        <p id="adblock-wall-body" className="mt-2 text-sm text-muted-foreground">
          SkinLabs® is free to read because it's partly ad-supported. Our editorial can't be bought: ads are labelled and
          never decide what we say about a product.
        </p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-foreground">
          <li>Open your ad blocker (usually an icon next to the address bar).</li>
          <li>Choose “Pause on this site” or allow skinlabs.co.za.</li>
          <li>Come back here and tap the button below.</li>
        </ol>
        {stillBlocked && (
          <p role="alert" className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
            We can still detect a blocker. Browsers with built-in blocking (Brave Shields, Safari content blockers)
            need it switched off for this site, then a reload.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => void recheck()} disabled={checking} className="w-full">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            I've turned it off
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        </div>
        <div className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          {viewer.isSignedIn ? (
            <>
              Prefer fewer ads?{" "}
              <a href={`/pricing?returnTo=${returnTo}`} className="font-medium text-foreground underline underline-offset-2">
                See the ad-light plans
              </a>
            </>
          ) : (
            <>
              Glow Insider member?{" "}
              <button type="button" onClick={() => openSignupDialog("signin")} className="font-medium text-foreground underline underline-offset-2">
                Sign in
              </button>{" "}
              ·{" "}
              <a href={`/pricing?returnTo=${returnTo}`} className="font-medium text-foreground underline underline-offset-2">
                See plans
              </a>
            </>
          )}
        </div>
      </div>
    </div>,
    container,
  );
};

export default AdBlockWall;
