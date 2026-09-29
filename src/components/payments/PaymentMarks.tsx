import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Accepted-payment marks for the checkout pickers. Inline SVG (no network
 * request, no third-party CDN) on a white chip, so each mark keeps its own
 * colours in both light and dark mode, the way card-acceptance marks are
 * normally shown. Only list a mark a gateway actually accepts.
 */
export type PaymentMark = "visa" | "mastercard" | "amex" | "paypal" | "instant-eft";

const LABELS: Record<PaymentMark, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  paypal: "PayPal",
  "instant-eft": "Instant EFT",
};

const Visa = () => (
  <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden="true">
    <text x="24" y="13.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontStyle="italic" fontWeight="900" fill="#1A1F71" letterSpacing="-0.5">
      VISA
    </text>
  </svg>
);

const Mastercard = () => (
  <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-hidden="true">
    <circle cx="14" cy="12" r="10" fill="#EB001B" />
    <circle cx="24" cy="12" r="10" fill="#F79E1B" />
    <path d="M19 3.3a10 10 0 0 1 0 17.4 10 10 0 0 1 0-17.4Z" fill="#FF5F00" />
  </svg>
);

const Amex = () => (
  <svg viewBox="0 0 40 24" className="h-5 w-auto" aria-hidden="true">
    <rect width="40" height="24" rx="3" fill="#2E77BC" />
    <text x="20" y="11" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.4" fontWeight="800" fill="#fff">
      AMERICAN
    </text>
    <text x="20" y="19.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.4" fontWeight="800" fill="#fff">
      EXPRESS
    </text>
  </svg>
);

const PayPal = () => (
  <svg viewBox="0 0 62 16" className="h-4 w-auto" aria-hidden="true">
    <text x="0" y="13" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontStyle="italic" fontWeight="800">
      <tspan fill="#003087">Pay</tspan>
      <tspan fill="#009CDE">Pal</tspan>
    </text>
  </svg>
);

const InstantEft = () => (
  <svg viewBox="0 0 86 16" className="h-4 w-auto" aria-hidden="true">
    <path d="M7 1.5 2 9h4l-1 5.5L11 7H7l1.5-5.5Z" fill="#0B5FFF" />
    <text x="15" y="12.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="10.5" fontWeight="800" fill="#0B3B8C" letterSpacing="0.2">
      INSTANT EFT
    </text>
  </svg>
);

const MARKS: Record<PaymentMark, () => ReactElement> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  paypal: PayPal,
  "instant-eft": InstantEft,
};

export const PaymentMarks = ({ marks, className }: { marks: PaymentMark[]; className?: string }) => (
  <ul className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label={`Accepts ${marks.map((m) => LABELS[m]).join(", ")}`}>
    {marks.map((mark) => {
      const Mark = MARKS[mark];
      return (
        <li
          key={mark}
          className="flex h-8 min-w-[3rem] items-center justify-center rounded-md border border-black/5 bg-white px-2 shadow-2xs"
          title={LABELS[mark]}
        >
          <Mark />
        </li>
      );
    })}
  </ul>
);

export default PaymentMarks;
