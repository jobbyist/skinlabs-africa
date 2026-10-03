import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROMO_END_DATE_LABEL } from "@/lib/promo";

interface PromoTrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BENEFITS = [
  "Start Glow Lite or Glow Insider free — no card required",
  "Your trial runs all the way through 1 November 2026, not the usual 7 days",
  "Every member benefit applies during your trial",
  "Advanced AI Analysis Passes stay a small once-off payment for every account",
];

/**
 * Conversion-focused popup for the promo chip / bar ("Free until 1 Nov").
 * Details the extended free-trial offer and routes to /pricing to pick a plan.
 * The full announcement stays one secondary link away.
 */
const PromoTrialModal = ({ open, onOpenChange }: PromoTrialModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100%-2rem)] gap-5 rounded-2xl p-6 sm:max-w-md">
      <DialogHeader className="space-y-3 text-left">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[image:var(--gradient-brand)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          <Sparkles className="h-3 w-3" aria-hidden />
          Limited time
        </span>
        <DialogTitle className="text-xl leading-snug">
          All paid plans are free until {PROMO_END_DATE_LABEL}
        </DialogTitle>
        <DialogDescription>
          Sign up for a free trial of Glow Lite or Glow Insider and it runs all the way through {PROMO_END_DATE_LABEL} — instead of the usual 7 days. Standard billing returns for everyone on {PROMO_END_DATE_LABEL}.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-2.5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="w-full">
        <Link to="/pricing" onClick={() => onOpenChange(false)}>
          See membership plans
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/announcements" className="underline underline-offset-2 hover:no-underline" onClick={() => onOpenChange(false)}>
          Read the full announcement
        </Link>
      </p>
    </DialogContent>
  </Dialog>
);

export default PromoTrialModal;
