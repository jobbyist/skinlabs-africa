import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, X } from "lucide-react";
import { useAdBlockDetection } from "@/hooks/use-adblock-detection";

const DISMISS_KEY = "skinlabs_adblock_notice_dismissed";

/**
 * Site-wide notice shown when an ad blocker is detected.
 * Encourages allowlisting or upgrading to a membership so the free tier stays sustainable.
 */
export default function AdBlockNotice() {
  const { adBlockDetected, checked } = useAdBlockDetection();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!checked || !adBlockDetected || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-lg rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-3 shadow-lg dark:bg-amber-950/90 sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1 text-sm text-amber-950 dark:text-amber-50">
          <p className="font-semibold">Ad blocker detected</p>
          <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">
            SkinLabs® is free and ad-supported. Please allow ads on this site, or{" "}
            <Link to="/pricing" className="font-medium underline underline-offset-2 hover:text-amber-950">
              upgrade to Glow Insider
            </Link>{" "}
            for an ad-light experience.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-amber-800 hover:bg-amber-200/60 dark:text-amber-200"
          aria-label="Dismiss ad blocker notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
