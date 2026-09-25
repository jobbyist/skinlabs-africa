import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PayPalButtons, { type PaypalApproval } from "@/components/payments/PayPalButtons";
import PaypalQuote from "@/components/payments/PaypalQuote";
import {
  formatBillingDate,
  formatUsd,
  formatZar,
  getPaypalConfig,
  type PaypalQuote as Quote,
  type PaypalSubscriptionPurchase,
} from "@/lib/paypal";
import { trackConversionEvent } from "@/lib/analytics-events";
import { notifyMembershipUpdated } from "@/hooks/use-membership";
import { toast } from "sonner";
import { TRIAL_STARTED_PATH } from "@/lib/intentRouting";

export interface MembershipCheckoutPlan {
  planId: string;
  name: string;
  interval: "monthly" | "annual";
}

interface MembershipCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MembershipCheckoutPlan | null;
  variantKey?: string;
  /** Where to go after approval. Defaults to react-router navigation; the SSR
   * routes (which only have a MemoryRouter) pass a full-page navigation. */
  onNavigate?: (to: string) => void;
}

/**
 * Subscribe-only: the no-card free trial is a separate one-tap path
 * (useStartTrial), so this dialog has no trial mode.
 *
 * Recurring membership checkout via a PayPal subscription — PayPal balance or
 * any debit/credit card. The server decides when the first charge happens:
 *  - a new trial: at the end of the free trial (7 days, or 1 November 2026
 *    while the extended-trial promo runs), then every month/year;
 *  - an account already on a trial: when that trial ends;
 *  - an account that has used its trial: today.
 * This dialog only displays what the server quoted; it never sets a date or price.
 */
const MembershipCheckoutDialog = ({
  open,
  onOpenChange,
  plan,
  variantKey = "control",
  onNavigate,
}: MembershipCheckoutDialogProps) => {
  const routerNavigate = useNavigate();
  const navigate = onNavigate ?? routerNavigate;
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuote(null);
    void getPaypalConfig().then((c) => setConfigured(c.configured));
  }, [open, plan?.planId, plan?.interval]);

  if (!plan) return null;

  const purchase: PaypalSubscriptionPurchase = {
    purchaseType: "plan",
    planId: plan.planId,
    interval: plan.interval,
    variantKey,
  };
  const per = plan.interval === "annual" ? "year" : "month";
  const firstBillingAt = quote?.subscription?.firstBillingAt ?? null;
  const startKind = quote?.subscription?.kind;

  const handleApproved = (result: PaypalApproval) => {
    if (result.kind !== "subscription") return;
    notifyMembershipUpdated();
    trackConversionEvent("checkout_completed", { purchaseType: "plan", plan: plan.planId, interval: plan.interval, gateway: "paypal" });
    if (result.startKind === "new_trial") {
      trackConversionEvent("trial_started", { plan: plan.planId });
      toast.success("Your free trial is live — PayPal will only charge you when it ends.");
      navigate(TRIAL_STARTED_PATH);
    } else if (result.startKind === "existing_trial") {
      toast.success("Auto-renew is on — your membership continues when your trial ends.");
      onOpenChange(false);
      navigate("/dashboard?tab=billing");
    } else {
      navigate(`/dashboard?payment=success&purchase_type=plan&plan=${plan.planId}&interval=${plan.interval}`);
    }
  };

  const locked = busy;
  // The server may still quote a first charge after a free period (e.g. an
  // account that never trialled); the title follows the quote, not a mode.
  const title = startKind === "new_trial" ? `Start your ${plan.name} free trial` : `Subscribe to ${plan.name}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !locked && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            Pay with your PayPal balance or any debit or credit card. Cancel any time from your dashboard.
          </DialogDescription>
        </DialogHeader>

        {configured === null ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : configured ? (
          <div className="space-y-4 pt-1">
            <PaypalQuote purchase={purchase} suffix={`/${per}`} onQuote={setQuote} />

            {quote && (
              <p className="flex items-start gap-2 text-sm text-foreground">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {firstBillingAt ? (
                  <span>
                    <span className="font-semibold">Nothing to pay today.</span> Your free trial runs until{" "}
                    {formatBillingDate(firstBillingAt)}; then PayPal charges {formatUsd(quote.amountUsd)} (
                    {formatZar(quote.amountZar)}) every {per} until you cancel. Cancel before{" "}
                    {formatBillingDate(firstBillingAt)} and you won't be charged.
                  </span>
                ) : (
                  <span>
                    You'll be charged {formatUsd(quote.amountUsd)} ({formatZar(quote.amountZar)}) today, then every {per}{" "}
                    until you cancel.
                  </span>
                )}
              </p>
            )}

            {quote && (
              <PayPalButtons
                purchase={purchase}
                onBusyChange={setBusy}
                onError={(message) => toast.error(message)}
                onApproved={handleApproved}
              />
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Online subscriptions are temporarily unavailable. Please try again soon or contact support@skinlabs.co.za.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MembershipCheckoutDialog;
