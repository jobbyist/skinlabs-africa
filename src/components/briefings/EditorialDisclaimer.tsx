import { ShieldCheck } from "lucide-react";

interface EditorialDisclaimerProps {
  text: string;
}

/**
 * Standalone block for a briefing's own editorial disclaimer, rendered once
 * at the end of the article (see src/lib/editorialDisclaimer.ts, which pulls
 * this text out of the body markdown rather than leaving it inline). Matches
 * the existing disclaimer treatment on Spotlight/ComparisonArticle pages.
 */
const EditorialDisclaimer = ({ text }: EditorialDisclaimerProps) => (
  <div className="flex gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <p>
      <span className="font-semibold text-foreground">Editorial disclaimer:</span> {text}
    </p>
  </div>
);

export default EditorialDisclaimer;
