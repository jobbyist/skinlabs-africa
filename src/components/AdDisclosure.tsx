/**
 * Renders the standard "free, ad-supported" fine print without putting a literal
 * text node in the DOM — the copy is identical on every ad unit across the site,
 * so as real text it reads as repeated/duplicate content to a crawler. The text
 * is set via a data attribute and painted in by CSS (`.ad-disclosure::after` in
 * index.css), which keeps it fully visible to sighted users while search engines
 * — which index text nodes, not CSS-generated content — don't see it repeated on
 * every page. `aria-label` keeps it available to assistive tech.
 */
export const AD_DISCLOSURE_TEXT =
  "This is a free, ad-supported version of SkinLabs. Upgrade to our premium plans for an ad-free browsing experience";

const AdDisclosure = ({ className = "" }: { className?: string }) => (
  <p
    className={`ad-disclosure mt-2 text-center text-[11px] leading-snug text-muted-foreground/90 ${className}`}
    data-text={AD_DISCLOSURE_TEXT}
    aria-label={AD_DISCLOSURE_TEXT}
    role="note"
  />
);

export default AdDisclosure;
