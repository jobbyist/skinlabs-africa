import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CreditCard, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PaymentGateway } from "@/lib/payments";
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
 * offer) routes through this one picker: PayFast for South African Rand, or
 * PayPal — PayPal balance or any debit/credit card — charged in USD at a live
 * rate. Recurring memberships use MembershipCheckoutDialog instead.
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{showPaypal ? "Pay with PayPal or card" : "How would you like to pay?"}</DialogTitle>
          <DialogDescription className="text-center">
            {showPaypal
              ? "Use your PayPal balance, or pay by debit or credit card — no PayPal account needed."
              : "Both options are secure — choose whichever is easiest for your card or account."}
          </DialogDescription>
        </DialogHeader>

        {showPaypal && paypal ? (
          <div className="space-y-4 pt-2">
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
          <div className="grid gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              className="h-auto justify-start gap-3 py-4"
              disabled={busy}
              onClick={() => void choose("payfast")}
            >
              {loading === "payfast" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <CreditCard className="h-5 w-5 shrink-0" />}
              <span className="text-left">
                <span className="block font-semibold">PayFast</span>
                <span className="block text-xs text-muted-foreground">South African Rand (ZAR) — card, EFT or Instant EFT</span>
              </span>
            </Button>
            {paypalAvailable && (
              <Button
                variant="outline"
                size="lg"
                className="h-auto justify-start gap-3 py-4"
                disabled={busy}
                onClick={() => void choose("paypal")}
              >
                {loading === "paypal" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Wallet className="h-5 w-5 shrink-0" />}
                <span className="text-left">
                  <span className="block font-semibold">PayPal or debit/credit card</span>
                  <span className="block text-xs text-muted-foreground">Charged in USD at today's live exchange rate</span>
                </span>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGatewayDialog;
