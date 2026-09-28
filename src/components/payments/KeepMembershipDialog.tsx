import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PayPalButtons, { type PaypalApproval } from "@/components/payments/PayPalButtons";
import PaypalQuote from "@/components/payments/PaypalQuote";
import { notifyMembershipUpdated, useMembership } from "@/hooks/use-membership";
import { trackConversionEvent } from "@/lib/analytics-events";
import { TIER_LABELS } from "@/lib/entitlements";
import { formatZar, getPaypalConfig, type PaypalSubscriptionPurchase } from "@/lib/paypal";
import { formatChargeDate, quoteMembership, startPayfastMembership, type MembershipQuote } from "@/lib/payfast";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { cn } from "@/lib/utils";

export interface KeepMembershipOptions {
  /** Defaults to the member's trial plan, else Glow Insider. */
  planId?: "insider" | "glow_lite";
  interval?: "monthly" | "annual";
  /** Analytics source, e.g. "trial_banner", "billing_tab", "email_keep_link". */
  source?: string;
}

interface KeepMembershipDialogProps extends KeepMembershipOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Post-checkout navigation; SSR routes pass a full page load. */
  onNavigate?: (to: string) => void;
}

/**
 * "Keep my membership": card-on-file auto-renew for a trial (or a
 * subscription billed today once the trial is used). States the rand price,
 * the exact first charge date and "cancel any time in Billing" BEFORE any
 * payment UI. Primary: PayFast (ZAR, card tokenised at R0 through 3-D Secure
 * for a trial). Secondary: PayPal (billed in US dollars at today's rate). The
 * server decides amount and dates (payfast-payment `subscription_quote`,
 * mirrored by paypal-payment `quote`); this only displays them.
 */
const KeepMembershipDialog = ({ open, onOpenChange, planId, interval, source = "unknown", onNavigate }: KeepMembershipDialogProps) => {
  const routerNavigate = useNavigate();
  const navigate = onNavigate ?? routerNavigate;
  const { trialPlan, billingInterval } = useMembership();
  const resolvedPlan: "insider" | "glow_lite" = planId ?? (trialPlan === "glow_lite" ? "glow_lite" : "insider");
  const [chosenInterval, setChosenInterval] = useState<"monthly" | "annual">(interval ?? billingInterval ?? "monthly");
  const [quote, setQuote] = useState<MembershipQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paypalAvailable, setPaypalAvailable] = useState(false);
  const [showPaypal, setShowPaypal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paypalBusy, setPaypalBusy] = useState(false);
  const variantKey = getPersistedPricingVariant();

  useEffect(() => {
    if (!open) return;
    setShowPaypal(false);
    trackConversionEvent("keep_membership_viewed", { source, plan: resolvedPlan });
    void getPaypalConfig().then((c) => setPaypalAvailable(c.configured));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setQuote(null);
    setQuoteError(null);
    quoteMembership({ planId: resolvedPlan, interval: chosenInterval, variantKey })
      .then((q) => active && setQuote(q))
      .catch((err: Error) => active && setQuoteError(err.message));
    return () => {
      active = false;
    };
  }, [open, resolvedPlan, chosenInterval, variantKey]);

  const planName = TIER_LABELS[resolvedPlan];
  const per = chosenInterval === "annual" ? "year" : "month";
  const locked = redirecting || paypalBusy;

  const payWithPayfast = async () => {
    trackConversionEvent("keep_membership_gateway_selected", { gateway: "payfast", source });
    setRedirecting(true);
    try {
      await startPayfastMembership({ planId: resolvedPlan, interval: chosenInterval, variantKey });
    } catch (err) {
      setRedirecting(false);
      toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
    }
  };

  const paypalPurchase: PaypalSubscriptionPurchase = {
    purchaseType: "plan",
    planId: resolvedPlan,
    interval: chosenInterval,
    variantKey,
  };

  const handlePaypalApproved = (result: PaypalApproval) => {
    if (result.kind !== "subscription") return;
    notifyMembershipUpdated();
    trackConversionEvent("keep_membership_completed", { gateway: "paypal", source, startKind: result.startKind });
    toast.success(
      result.startKind === "immediate"
        ? `Welcome to ${planName}. Auto-renew is on.`
        : "Auto-renew is on. Nothing is charged before your trial ends.",
    );
    onOpenChange(false);
    navigate("/dashboard?tab=billing");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !locked && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Keep {planName}</DialogTitle>
          <DialogDescription>
            {quote?.startKind === "immediate"
              ? `Subscribe to ${planName}. Cancel any time in Billing.`
              : `Stay on ${planName} when your free trial ends. Cancel any time in Billing.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex rounded-xl border border-border p-1" role="radiogroup" aria-label="Billing interval">
          {(["monthly", "annual"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={chosenInterval === value}
              disabled={locked}
              onClick={() => setChosenInterval(value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                chosenInterval === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>

        {quoteError ? (
          <p role="alert" className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground">
            {quoteError}
          </p>
        ) : !quote ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading your price" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="font-heading text-2xl font-extrabold text-foreground">
                {formatZar(quote.amountZar)}
                <span className="text-sm font-medium text-muted-foreground"> /{per}</span>
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {quote.firstChargeDate ? (
                    <span>
                      <span className="font-semibold">Nothing to pay today.</span> First charge:{" "}
                      {formatZar(quote.amountZar)} on {formatChargeDate(quote.firstChargeDate)}, then every {per}.
                    </span>
                  ) : (
                    <span>
                      {formatZar(quote.amountZar)} today, then every {per}.
                    </span>
                  )}
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Cancel any time in Billing{quote.firstChargeDate ? " — before that date and you pay nothing" : ""}.</span>
                </li>
              </ul>
            </div>

            {!showPaypal ? (
              <div className="space-y-2">
                {quote.payfastAvailable && (
                  <Button className="w-full gap-2" disabled={locked} onClick={() => void payWithPayfast()}>
                    {redirecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    Pay with PayFast
                  </Button>
                )}
                {paypalAvailable && (
                  <Button
                    variant={quote.payfastAvailable ? "outline" : "default"}
                    className="w-full"
                    disabled={locked}
                    onClick={() => {
                      trackConversionEvent("keep_membership_gateway_selected", { gateway: "paypal", source });
                      setShowPaypal(true);
                    }}
                  >
                    Pay with PayPal
                  </Button>
                )}
                {!quote.payfastAvailable && !paypalAvailable && (
                  <p className="text-center text-sm text-muted-foreground">
                    Online payments are temporarily unavailable. Please try again soon or contact support@skinlabs.co.za.
                  </p>
                )}
                {quote.payfastAvailable && (
                  <p className="text-center text-xs text-muted-foreground">
                    {quote.firstChargeDate
                      ? "PayFast confirms your card with 3-D Secure. No money is taken today."
                      : "You'll confirm the payment with 3-D Secure on PayFast."}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  PayPal bills in US dollars at today's rate, so the amount on your statement can differ slightly from the rand price.
                </p>
                <PaypalQuote purchase={paypalPurchase} suffix={`/${per}`} />
                <PayPalButtons
                  purchase={paypalPurchase}
                  onBusyChange={setPaypalBusy}
                  onError={(message) => toast.error(message)}
                  onApproved={handlePaypalApproved}
                />
                <Button variant="ghost" size="sm" className="w-full" disabled={locked} onClick={() => setShowPaypal(false)}>
                  Back
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KeepMembershipDialog;
