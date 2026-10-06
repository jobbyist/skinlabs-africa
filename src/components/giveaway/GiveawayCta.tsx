import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GIVEAWAY_ASSESSMENT_PATH, GIVEAWAY_COPY } from "@/lib/giveaway/campaign";
import { trackGiveawayCta, type GiveawayCtaLocation } from "@/lib/giveaway/analytics";

/**
 * Primary giveaway CTA, routed to the existing free assessment (/skynn-ai). A plain client-side <Link>:
 * the visit's utm_* / ttclid labels live in sessionStorage (src/lib/attribution.ts), so nothing needs to ride on the
 * URL, and a signed-out visitor can finish the whole quiz before the existing "save your results" sign-up step.
 */
const GiveawayCta = ({
  location,
  className,
}: {
  location: GiveawayCtaLocation;
  className?: string;
}) => {
  return (
    <Button
      asChild
      size="lg"
      className={cn("h-auto min-h-14 w-full whitespace-normal rounded-full px-6 py-3 text-center text-base font-semibold sm:w-auto gradient-bg border-0 shadow-md hover:opacity-95", className)}
    >
      <Link to={GIVEAWAY_ASSESSMENT_PATH} onClick={() => trackGiveawayCta(location, "primary")}>
        {GIVEAWAY_COPY.primaryCta}
        <ArrowRight className="ml-1 h-5 w-5" aria-hidden="true" />
      </Link>
    </Button>
  );
};

export default GiveawayCta;
