import { useState } from "react";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PaymentGateway } from "@/lib/payments";

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves once checkout has actually started (i.e. the browser is about
   * to navigate away) or failed — the dialog shows a spinner meanwhile and
   * stays open on failure so the visitor can pick the other gateway. */
  onSelect: (gateway: PaymentGateway) => Promise<void>;
}

/**
 * Every purchase flow (plan subscription, Analysis Pass credit packs, the
 * founding-member offer) routes through this one picker rather than each
 * duplicating gateway-choice UI — PayFast for South African Rand,
 * PayPal for an international/USD card.
 */
const PaymentGatewayDialog = ({ open, onOpenChange, onSelect }: PaymentGatewayDialogProps) => {
  const [loading, setLoading] = useState<PaymentGateway | null>(null);

  const choose = async (gateway: PaymentGateway) => {
    setLoading(gateway);
    await onSelect(gateway);
    setLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">How would you like to pay?</DialogTitle>
          <DialogDescription className="text-center">
            Both options are secure — choose whichever is easiest for your card or account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            className="h-auto justify-start gap-3 py-4"
            disabled={!!loading}
            onClick={() => void choose("payfast")}
          >
            {loading === "payfast" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <CreditCard className="h-5 w-5 shrink-0" />}
            <span className="text-left">
              <span className="block font-semibold">PayFast</span>
              <span className="block text-xs text-muted-foreground">South African Rand (ZAR) — card, EFT or Instant EFT</span>
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto justify-start gap-3 py-4"
            disabled={!!loading}
            onClick={() => void choose("paypal")}
          >
            {loading === "paypal" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Wallet className="h-5 w-5 shrink-0" />}
            <span className="text-left">
              <span className="block font-semibold">PayPal</span>
              <span className="block text-xs text-muted-foreground">Charged in USD, converted from the ZAR price</span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGatewayDialog;
