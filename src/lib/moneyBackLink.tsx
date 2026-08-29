import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const MONEY_BACK_PHRASE_RE = /(\d+-day money-back guarantee)/i;

/**
 * Splits body copy on any "{n}-day money-back guarantee" phrase and turns
 * that phrase into a link to the full clause on the Terms of Service page.
 * Every on-site mention of the guarantee should route through this so the
 * link stays consistent if the wording or window ever changes.
 */
export const linkifyMoneyBackGuarantee = (text: string): ReactNode => {
  const parts = text.split(MONEY_BACK_PHRASE_RE);
  if (parts.length === 1) return text;
  // String.split with a capturing group interleaves [text, match, text, match, ...],
  // so odd indices are always the captured phrase.
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Link key={index} to="/terms-of-service#money-back-guarantee" className="text-primary hover:underline">
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
};
