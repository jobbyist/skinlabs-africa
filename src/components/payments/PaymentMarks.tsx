import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Accepted-payment marks for the checkout pickers. Inline SVG (no network
 * request, no third-party CDN) on a white chip, so each mark keeps its own
 * colours in both light and dark mode, the way card-acceptance marks are
 * normally shown. Only list a mark a gateway actually accepts.
 *
 * Visa and Apple Pay use the brands' own artwork (paths from simple-icons,
 * CC0); Mastercard is drawn with its official colours and circle geometry.
 */
export type PaymentMark = "visa" | "mastercard" | "amex" | "paypal" | "apple-pay";

const LABELS: Record<PaymentMark, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  paypal: "PayPal",
  "apple-pay": "Apple Pay",
};

const Visa = () => (
  <svg viewBox="0 7.2 24 9.6" className="h-3 w-auto" aria-hidden="true">
    <path
      fill="#1A1F71"
      d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
    />
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

const ApplePay = () => (
  <svg viewBox="0 4.2 24 15.6" className="h-5 w-auto" aria-hidden="true">
    <path
      fill="#000"
      d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"
    />
  </svg>
);

const MARKS: Record<PaymentMark, () => ReactElement> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  paypal: PayPal,
  "apple-pay": ApplePay,
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
