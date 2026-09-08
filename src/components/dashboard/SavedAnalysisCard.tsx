import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";

export interface SavedRecommendationRow {
  id: string;
  skin_type: string;
  concerns: string[];
  created_at: string;
  status: string;
  mst_tone: number | null;
  analysis_completeness: number | null;
  result_payload: unknown;
}

interface SavedAnalysisCardProps {
  rec: SavedRecommendationRow;
}

/**
 * One saved SKYNN AI result in the dashboard's Reports tab. `result_payload`
 * is only populated for rows saved by Starter Analysis 2.0 (see
 * persistence.ts) — older rows and the live/Advanced AI path (persisted
 * server-side by supabase/functions/skincare-ai) don't carry it, so this
 * falls back to the plain skin-type/concerns summary in that case rather than
 * claiming detail that isn't there. Never shows a "dermatologist reviewed"
 * badge — that workflow doesn't exist yet (see Section 19 of the spec).
 */
const SavedAnalysisCard = ({ rec }: SavedAnalysisCardProps) => {
  const [open, setOpen] = useState(false);
  const result = rec.result_payload as StarterAnalysisResult | null;
  const isStarter = Boolean(result);

  return (
    <div className="border-b border-border last:border-0 py-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground capitalize">{rec.skin_type} Skin</p>
            <Badge variant="outline" className="text-[10px]">{isStarter ? "Starter Analysis" : "SKYNN AI Advanced"}</Badge>
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {rec.concerns.slice(0, 3).map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
            {rec.concerns.length > 3 && <Badge variant="secondary" className="text-xs">+{rec.concerns.length - 3}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{new Date(rec.created_at).toLocaleDateString()}</p>
            <Badge variant={rec.status === "delivered" ? "default" : "secondary"} className="text-xs">{rec.status}</Badge>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-muted/30 p-4">
          {rec.analysis_completeness !== null && (
            <p className="text-xs text-muted-foreground">
              {rec.analysis_completeness}% analysis completeness — how much information SKYNN AI had to work with, not a clinical accuracy score.
            </p>
          )}
          {result ? (
            <>
              <div>
                <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary" />Skin Story</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.skinStory.narrative}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Top priorities</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.priorities.items.map((p) => (
                    <Badge key={p.key} variant="secondary" className="text-[10px] capitalize">
                      {p.rank}. {priorityLabel(p.key)} ({p.level})
                    </Badge>
                  ))}
                </div>
              </div>
              {result.refinementHistory.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Refined {result.refinementHistory.length}× — last: {result.refinementHistory[result.refinementHistory.length - 1]?.reason?.replace(/_/g, " ")}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70">
                Result v{result.versions.resultVersion} · scoring v{result.versions.scoringVersion}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Saved before the detailed Skin Story view — the full report is in your downloaded PDF from that analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedAnalysisCard;
