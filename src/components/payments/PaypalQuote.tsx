import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatUsd, formatZar, getPaypalQuote, type PaypalPurchase, type PaypalQuote as Quote } from "@/lib/paypal";

interface PaypalQuoteProps {
  purchase: PaypalPurchase;
  /** Suffix after the price, e.g. "/month". */
  suffix?: string;
  onQuote?: (quote: Quote | null) => void;
  onError?: (message: string) => void;
}

/**
 * Shows the ZAR list price next to the USD amount PayPal will actually
 * charge, at the real-time rate the server will use for this exact checkout.
 */
const PaypalQuote = ({ purchase, suffix = "", onQuote, onError }: PaypalQuoteProps) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(purchase);

  useEffect(() => {
    let active = true;
    setQuote(null);
    setError(null);
    getPaypalQuote(purchase)
      .then((q) => {
        if (!active) return;
        setQuote(q);
        onQuote?.(q);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        onQuote?.(null);
        onError?.(err.message);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!quote) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Getting today's exchange rate…
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
      <p className="text-foreground">
        <span className="font-semibold">{formatZar(quote.amountZar)}{suffix}</span>
        <span className="text-muted-foreground"> ≈ </span>
        <span className="font-semibold">{formatUsd(quote.amountUsd)}{suffix}</span>
        <span className="text-muted-foreground"> charged in USD</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {quote.rateSource === "live" ? "Live rate" : "Latest rate"}: R1 = US${quote.rate.toFixed(4)} ·{" "}
        US$1 = R{(1 / quote.rate).toFixed(2)}. PayPal doesn't process Rand, so we convert at checkout — your bank may
        show a small conversion difference on your statement.
      </p>
    </div>
  );
};

export default PaypalQuote;
