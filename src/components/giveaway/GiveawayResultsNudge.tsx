import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GIVEAWAY_DEADLINE_LABEL, GIVEAWAY_PATH, GIVEAWAY_TIKTOK_HANDLE, isGiveawayOpen } from "@/lib/giveaway/campaign";
import { hasGiveawayContext, trackGiveawayCta } from "@/lib/giveaway/analytics";

/**
 * Shown on the SKYNN AI results ONLY to someone who came through the October 2026 giveaway (and only while it is
 * open): the assessment is step one, so this carries them to the rest of the entry instead of losing them at the
 * results. It reads no result content, and it renders nothing for every other visitor.
 */
const GiveawayResultsNudge = () => {
  const [show] = useState(() => hasGiveawayContext() && isGiveawayOpen());
  if (!show) return null;
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-muted/45 p-4 sm:flex-row" data-testid="giveaway-nudge">
      <p className="text-sm text-secondary-text">
        <strong className="text-foreground">Giveaway:</strong> assessment done. Next, share your Skin Story on your TikTok Story, tag {GIVEAWAY_TIKTOK_HANDLE}, then confirm your entry before {GIVEAWAY_DEADLINE_LABEL}. Save your results first (free) so we can reach you if you win.
      </p>
      <Button asChild className="h-auto min-h-11 shrink-0 gap-2 whitespace-normal">
        <Link to={`${GIVEAWAY_PATH}#enter`} onClick={() => trackGiveawayCta("entry", "enter")}>
          Back to the giveaway <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
};

export default GiveawayResultsNudge;
