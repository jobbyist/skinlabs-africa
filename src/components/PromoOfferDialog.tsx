import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trackConversionEvent } from "@/lib/analytics-events";
import { PROMO_END_DATE_LABEL } from "@/lib/promo";

/**
 * Explains the free-access promo and sends the visitor to /pricing, where the
 * one-tap trial lives. Wording is deliberately limited to what the promo
 * announcement (src/data/announcements.ts) already states: Glow Lite and Glow
 * Insider are free to try with no card required until PROMO_END_AT, and the
 * Advanced AI Dermatology Analysis stays a once-off Analysis Pass.
 */
const POINTS = [
  "Glow Lite and Glow Insider are free to try, with no card required",
  "Your free trial runs all the way to the end date instead of the usual 7 days",
  "Every member benefit applies, except ad-free browsing, which stays a Glow VIP perk",
  "Billing only starts if you choose to keep your membership",
];

interface PromoOfferDialogProps {
  /** The element that opens the modal (must accept a ref/click, e.g. a button). */
  children: React.ReactNode;
  /** Where the trigger sits, for analytics. */
  source: string;
}

const PromoOfferDialog = ({ children, source }: PromoOfferDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) trackConversionEvent("promo_modal_opened", { source });
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <span className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <DialogTitle className="font-heading text-xl">
            All paid plans are free to try until {PROMO_END_DATE_LABEL}
          </DialogTitle>
          <DialogDescription>
            A limited-time offer for new and existing SkinLabs® members.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          The Advanced AI Dermatology Analysis still uses an Analysis Pass. The free Basic AI Skin Analysis is
          free for everyone.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link
              to="/pricing"
              onClick={() => {
                trackConversionEvent("promo_modal_cta_clicked", { source });
                setOpen(false);
              }}
            >
              See plans and start free
            </Link>
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link to="/announcements" onClick={() => setOpen(false)}>
              Read the announcement
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoOfferDialog;
