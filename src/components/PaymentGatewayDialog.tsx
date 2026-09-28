import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CreditCard, Wallet, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PAYFAST_ENABLED, type PaymentGateway } from "@/lib/payments";
import PaymentMarks, { type PaymentMark } from "@/components/payments/PaymentMarks";
import { cn } from "@/lib/utils";
import { getPaypalConfig, type PaypalOrderPurchase } from "@/lib/paypal";
import PayPalButtons, { type PaypalApproval } from "@/components/payments/PayPalButtons";
import PaypalQuote from "@/components/payments/PaypalQuote";
import { toast } from "sonner";

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves once checkout has actually started (i.e. the browser is about
   * to navigate away) or failed — the dialog shows a spinner meanwhile and
   * stays open on failure so the visitor can pick the other gateway. Used
   * for PayFast, and for PayPal when no inline `paypal` purchase is given. */
  onSelect: (gateway: PaymentGateway) => Promise<void>;
  /** One-off purchase to pay for inline with PayPal Smart Buttons (PayPal
   * balance or debit/credit card, in a popup — no full-page redirect). */
  paypal?: PaypalOrderPurchase;
  /** Called after an inline PayPal payment is captured and granted server-side. */
  onPaypalApproved?: (result: PaypalApproval) => void;
}

/**
 * Every one-off purchase flow (Analysis Pass credit packs, the founding-member
 * offer) routes through this one picker: PayPal — PayPal balance or any
 * debit/credit card — charged in USD at a live rate, or PayFast for South
 * African Rand (shown as "Temporarily unavailable" while PAYFAST_ENABLED is
 * false). Recurring memberships use MembershipCheckoutDialog instead.
 */
const PaymentGatewayDialog = ({ open, onOpenChange, onSelect, paypal, onPaypalApproved }: PaymentGatewayDialogProps) => {
  const [loading, setLoading] = useState<PaymentGateway | null>(null);
  const [showPaypal, setShowPaypal] = useState(false);
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [paypalAvailable, setPaypalAvailable] = useState(true);

  useEffect(() => {
    if (!open) {
      setShowPaypal(false);
      return;
    }
    void getPaypalConfig().then((c) => setPaypalAvailable(c.configured));
  }, [open]);

  const choose = async (gateway: PaymentGateway) => {
    if (gateway === "payfast" && !PAYFAST_ENABLED) return;
    if (gateway === "paypal" && paypal) {
      setShowPaypal(true);
      return;
    }
    setLoading(gateway);
    await onSelect(gateway);
    setLoading(null);
  };

  const busy = !!loading || paypalBusy;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      {/* Inset, rounded card on every screen (the shared Dialog is edge-to-edge
          below sm), capped to the viewport and scrollable, so nothing can push
          past the screen width or height. */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-5 rounded-3xl p-5 max-h-[calc(100dvh-2rem)] overflow-y-auto sm:rounded-3xl sm:p-7">
        <DialogHeader className="space-y-1.5 pr-8 text-left">
          <DialogTitle className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            {showPaypal ? "Pay with PayPal or card" : "How would you like to pay?"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {showPaypal
              ? "Use your PayPal balance, or pay by debit or credit card — no PayPal account needed."
              : "Every option is secure — choose whichever is easiest for your card or account."}
          </DialogDescription>
        </DialogHeader>

        {showPaypal && paypal ? (
          <div className="min-w-0 space-y-4">
            <PaypalQuote purchase={paypal} />
            <PayPalButtons
              purchase={paypal}
              onBusyChange={setPaypalBusy}
              onError={(message) => toast.error(message)}
              onApproved={(result) => onPaypalApproved?.(result)}
            />
            <Button variant="ghost" size="sm" className="gap-1.5" disabled={paypalBusy} onClick={() => setShowPaypal(false)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Other payment options
            </Button>
          </div>
        ) : (
          <div className="grid min-w-0 gap-3">
            {paypalAvailable && (
              <GatewayOption
                icon={Wallet}
                title="PayPal or debit/credit card"
                subtitle="Charged in USD at today's live exchange rate."
                marks={["paypal", "visa", "mastercard", "amex"]}
                loading={loading === "paypal"}
                disabled={busy}
                onClick={() => void choose("paypal")}
              />
            )}
            <GatewayOption
              icon={CreditCard}
              title="PayFast"
              subtitle="South African Rand (ZAR) — card, EFT or Instant EFT."
              marks={["visa", "mastercard", "amex", "instant-eft"]}
              loading={loading === "payfast"}
              disabled={busy || !PAYFAST_ENABLED}
              unavailable={!PAYFAST_ENABLED}
              onClick={() => void choose("payfast")}
            />
            {!paypalAvailable && !PAYFAST_ENABLED && (
              <p role="status" className="text-center text-sm text-muted-foreground">
                Online payments are temporarily unavailable. Please try again soon or contact support@skinlabs.co.za.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface GatewayOptionProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  marks: PaymentMark[];
  loading: boolean;
  disabled: boolean;
  /** Shown but switched off (e.g. PayFast while PAYFAST_ENABLED is false). */
  unavailable?: boolean;
  onClick: () => void;
}

/** One selectable gateway card: outline icon, title + subtitle, accepted marks. Text always wraps. */
const GatewayOption = ({ icon: Icon, title, subtitle, marks, loading, disabled, unavailable = false, onClick }: GatewayOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-disabled={disabled}
    className={cn(
      "group w-full min-w-0 rounded-2xl border border-border bg-card p-4 text-left transition-[border-color,box-shadow,transform] duration-150 ease-out sm:p-5",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      unavailable
        ? "cursor-not-allowed opacity-60"
        : "hover:border-foreground/40 hover:shadow-md active:scale-[0.99] disabled:cursor-wait disabled:opacity-70",
    )}
  >
    <span className="flex min-w-0 items-start gap-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">{title}</span>
          {unavailable && (
            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Temporarily unavailable
            </span>
          )}
        </span>
        <span className="mt-0.5 block break-words text-sm leading-snug text-muted-foreground">{subtitle}</span>
      </span>
    </span>
    <PaymentMarks marks={marks} className="mt-3.5" />
  </button>
);

export default PaymentGatewayDialog;
