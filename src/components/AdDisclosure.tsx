import { useViewerContext } from "@/hooks/use-viewer-context";

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
  "This is the free, ad-supported version of SkinLabs. Glow Insider members get ad-light browsing.";
export const AD_LIGHT_DISCLOSURE_TEXT = "Ad-light browsing: as a Glow Insider member you see far fewer ads.";

/** Context-aware: an ad-light member is told why they still see this one unit, not asked to upgrade. */
const AdDisclosure = ({ className = "" }: { className?: string }) => {
  const { adPolicy } = useViewerContext();
  const text = adPolicy === "light" ? AD_LIGHT_DISCLOSURE_TEXT : AD_DISCLOSURE_TEXT;
  return (
    <p
      className={`ad-disclosure mt-2 text-center text-[11px] leading-snug text-muted-foreground/90 ${className}`}
      data-text={text}
      aria-label={text}
      role="note"
    />
  );
};

export default AdDisclosure;
