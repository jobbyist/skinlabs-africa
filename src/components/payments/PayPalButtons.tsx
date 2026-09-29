import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  activatePaypalSubscription,
  capturePaypalOrder,
  createPaypalOrder,
  createPaypalSubscription,
  loadPaypalSdk,
  type PaypalPurchase,
} from "@/lib/paypal";

export type PaypalApproval =
  | { kind: "order"; purchaseType: string; needsReview?: boolean }
  | { kind: "subscription"; startKind: "new_trial" | "existing_trial" | "immediate"; trialEndsAt: string | null };

interface PayPalButtonsProps {
  purchase: PaypalPurchase;
  /** Called once the payment/subscription is confirmed server-side. */
  onApproved: (result: PaypalApproval) => void;
  onError?: (message: string) => void;
  /** Toggled while the server is confirming, so the parent can block closing. */
  onBusyChange?: (busy: boolean) => void;
}

/**
 * PayPal Smart Buttons rendered inline (popup checkout, no full-page
 * redirect): a "PayPal" button for PayPal balance/linked cards, and a
 * "Debit or Credit Card" button for paying by card without a PayPal account
 * where PayPal offers guest checkout. Orders/subscriptions are always created
 * and confirmed by the paypal-payment edge function — the SDK never sets a
 * price.
 */
const PayPalButtons = ({ purchase, onApproved, onError, onBusyChange }: PayPalButtonsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Keep the latest callbacks without re-rendering the PayPal iframe.
  const callbacks = useRef({ onApproved, onError, onBusyChange });
  callbacks.current = { onApproved, onError, onBusyChange };

  const purchaseKey = JSON.stringify(purchase);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    setLoading(true);
    setLoadError(null);

    const isSubscription = purchase.purchaseType === "plan";
    const callbackUrl = `${window.location.origin}/dashboard?payment=success`;

    const setBusy = (busy: boolean) => {
      setConfirming(busy);
      callbacks.current.onBusyChange?.(busy);
    };
    const fail = (err: unknown) => {
      setBusy(false);
      callbacks.current.onError?.(err instanceof Error ? err.message : "Payment failed. Please try again.");
    };

    const style = { layout: "vertical", shape: "pill", label: isSubscription ? "subscribe" : "pay", height: 44, tagline: false };

    const options: Record<string, unknown> = isSubscription
      ? {
          style,
          createSubscription: async () => {
            const { subscriptionId } = await createPaypalSubscription(purchase, callbackUrl);
            return subscriptionId;
          },
          onApprove: async (data: { subscriptionID?: string }) => {
            if (!data.subscriptionID) return fail(new Error("PayPal didn't return a subscription."));
            setBusy(true);
            try {
              const result = await activatePaypalSubscription(data.subscriptionID);
              setBusy(false);
              callbacks.current.onApproved({ kind: "subscription", startKind: result.startKind, trialEndsAt: result.trialEndsAt });
            } catch (err) {
              fail(err);
            }
          },
          onError: fail,
        }
      : {
          style,
          createOrder: async () => {
            const { orderId } = await createPaypalOrder(purchase, callbackUrl);
            return orderId;
          },
          onApprove: async (data: { orderID: string }, actions: { restart?: () => Promise<void> }) => {
            setBusy(true);
            try {
              const result = await capturePaypalOrder(data.orderID);
              setBusy(false);
              callbacks.current.onApproved({ kind: "order", purchaseType: result.purchaseType ?? purchase.purchaseType, needsReview: result.needsReview });
            } catch (err) {
              // A declined card is recoverable: PayPal lets the buyer pick another funding source.
              if (err instanceof Error && /declined/i.test(err.message) && actions.restart) {
                setBusy(false);
                callbacks.current.onError?.(err.message);
                return actions.restart();
              }
              fail(err);
            }
          },
          onError: fail,
        };

    loadPaypalSdk(isSubscription ? "subscription" : "order")
      .then(async (paypal) => {
        if (cancelled) return;
        const buttons = paypal.Buttons(options);
        if (!buttons.isEligible()) throw new Error("PayPal checkout isn't available in this browser.");
        await buttons.render(container);
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoading(false);
        setLoadError(err instanceof Error ? err.message : "Couldn't load PayPal.");
      });

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
    // purchaseKey captures every field of `purchase`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseKey]);

  return (
    <div className="relative">
      {loading && (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading PayPal" />
        </div>
      )}
      {loadError && <p role="alert" className="py-4 text-center text-sm text-destructive">{loadError}</p>}
      {/* PayPal's iframes are white; keep them on a light surface in dark mode too. */}
      <div ref={containerRef} className="rounded-2xl bg-white px-2 pt-2 empty:hidden" />
      {confirming && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/90 text-sm text-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Confirming with PayPal…
        </div>
      )}
    </div>
  );
};

export default PayPalButtons;
