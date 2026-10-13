import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContextualActions } from "@/hooks/use-contextual-actions";
import { notifyMemberContextChanged } from "@/lib/context/changeEvent";
import type { ResolvedAction } from "@/lib/context";
import { trackConversionEvent } from "@/lib/analytics-events";
import { trackSkynnEvent } from "@/lib/skynn/analytics";

/**
 * The step after a saved Basic AI Skin Analysis: results -> routine -> everything else.
 * Chosen by the contextual engine for the `analysis_results` surface, so a member who just
 * finished is offered their routine first, and the Advanced AI Dermatology Analysis only in
 * the form that fits them (start it with a Pass in hand, get a Pass otherwise, or nothing
 * while it is pending / the rollout is closed). Signed-out previews don't see it: the
 * save-your-results gate above is their one next step.
 */
const ResultsNextSteps = ({ saved }: { saved: boolean }) => {
  const { primary, secondary, loading, click } = useContextualActions("analysis_results", { secondaryLimit: 2 });

  // The analysis was only just saved: make sure the shared snapshot has caught up.
  useEffect(() => {
    if (saved) notifyMemberContextChanged();
  }, [saved]);

  if (!saved || loading || !primary) return null;

  const row = (a: ResolvedAction, prominent: boolean) =>
    a.href ? (
      <Button asChild size={prominent ? "lg" : "sm"} variant={prominent ? "default" : "outline"} className="h-auto min-h-11 max-w-full gap-2 whitespace-normal py-2.5 text-center">
        <Link
          to={a.href}
          onClick={() => {
            click(a);
            // Keep the existing Advanced funnel metrics (Admin → SKYNN Reviews reads them).
            if (a.feature === "skynn_advanced") {
              trackConversionEvent("advanced_assessment_upsell_clicked", { funnelLocation: "results" });
              trackSkynnEvent("skynn_mode_selected", { mode: "advanced", source: "results" });
            }
          }}
        >
          {prominent && <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {a.label}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </Button>
    ) : null;

  return (
    <section aria-label="What to do next" className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-sm font-medium text-card-foreground">{primary.reason}</p>
      <div>{row(primary, true)}</div>
      {secondary.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          {secondary.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{a.reason}</p>
              <div className="shrink-0">{row(a, false)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ResultsNextSteps;
