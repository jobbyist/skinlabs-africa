import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EvidenceLevel = Database["public"]["Enums"]["evidence_level"];

const LABELS: Record<EvidenceLevel, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  limited: "Limited evidence",
  anecdotal: "Anecdotal evidence",
  none: "Insufficient evidence",
};

const STYLES: Record<EvidenceLevel, string> = {
  strong: "border-primary/30 bg-primary/10 text-primary",
  moderate: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  limited: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  anecdotal: "border-muted-foreground/30 bg-muted text-muted-foreground",
  none: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

/** Evidence-level badge — never a clinical-accuracy claim, just how much
 *  supporting evidence is behind the ingredient's stated function. */
const EvidenceBadge = ({ level, className }: { level: EvidenceLevel | null; className?: string }) => {
  if (!level) {
    return (
      <Badge variant="outline" className={cn("border-muted-foreground/30 text-muted-foreground", className)}>
        Evidence not yet reviewed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(STYLES[level], className)}>
      {LABELS[level]}
    </Badge>
  );
};

export default EvidenceBadge;
