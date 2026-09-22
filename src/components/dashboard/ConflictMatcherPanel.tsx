import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Sparkles, CheckCircle2, Snowflake, ShieldAlert } from "lucide-react";
import FeatureGate from "@/components/FeatureGate";
import { Skeleton } from "@/components/ui/skeleton";
import { useConflictMatcher } from "@/hooks/use-conflict-matcher";
import { useEntitlements } from "@/hooks/use-entitlements";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";
import type { ConflictFlag } from "@/lib/conflictMatcher";

const FLAG_META: Record<ConflictFlag["interactionType"], { label: string; icon: typeof AlertTriangle; className: string }> = {
  avoid_combining: { label: "Avoid combining", icon: AlertTriangle, className: "border-destructive/30 bg-destructive/5 text-destructive" },
  requires_spacing: { label: "Space out use", icon: Clock, className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  enhances: { label: "Works well together", icon: Sparkles, className: "border-primary/30 bg-primary/5 text-primary" },
  compatible: { label: "Compatible", icon: CheckCircle2, className: "border-primary/30 bg-primary/5 text-primary" },
  buffers: { label: "Helps buffer irritation", icon: CheckCircle2, className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
};

/** Renders an ingredient's display name, linked to its /ingredients/:slug
 *  profile when a real slug is available (never a guessed/broken link). */
const IngredientName = ({ ingredient }: { ingredient: ConflictFlag["ingredientA"] }) => {
  const name = ingredient.commonName || ingredient.inciName;
  if (!ingredient.slug) return <>{name}</>;
  return (
    <Link to={`/ingredients/${ingredient.slug}`} className="underline underline-offset-2 hover:no-underline">
      {name}
    </Link>
  );
};

const FlagCard = ({ flag }: { flag: ConflictFlag }) => {
  const meta = FLAG_META[flag.interactionType];
  const Icon = meta.icon;
  const nameA = flag.ingredientA.commonName || flag.ingredientA.inciName;
  const nameB = flag.ingredientB.commonName || flag.ingredientB.inciName;
  const productsA = flag.ingredientA.fromProducts.map((p) => p.productName).join(", ");
  const productsB = flag.ingredientB.fromProducts.map((p) => p.productName).join(", ");
  return (
    <div className={`rounded-xl border p-3.5 text-xs ${meta.className}`}>
      <div className="flex items-center gap-1.5 font-semibold">
        <Icon className="h-3.5 w-3.5" />
        <IngredientName ingredient={flag.ingredientA} /> + <IngredientName ingredient={flag.ingredientB} /> — {meta.label}
      </div>
      <p className="mt-1 opacity-80">
        {nameA} ({productsA}) · {nameB} ({productsB})
      </p>
      {flag.explanation && <p className="mt-1.5 opacity-90">{flag.explanation}</p>}
      {flag.usageGuidance && <p className="mt-1 font-medium opacity-90">Tip: {flag.usageGuidance}</p>}
    </div>
  );
};

const PanelBody = ({ routine }: { routine: GroundedRoutine }) => {
  const { can, loading: entitlementsLoading } = useEntitlements();
  const { data, isLoading, isError } = useConflictMatcher(routine, can("routine.conflict_matcher"));

  if (entitlementsLoading || isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-xs text-muted-foreground">Couldn't check this routine for conflicts right now — please try again shortly.</p>;
  }

  if (!data || data.routineIngredients.length === 0) {
    return <p className="text-xs text-muted-foreground">No matched products in this routine to scan yet.</p>;
  }

  const { flags, synergies, seasonalTips } = data;

  return (
    <div className="space-y-4">
      {flags.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Flagged combinations
          </p>
          <div className="space-y-2">
            {flags.map((f, i) => (
              <FlagCard key={i} flag={f} />
            ))}
          </div>
        </div>
      )}

      {synergies.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Combinations that mesh well
          </p>
          <div className="space-y-2">
            {synergies.map((f, i) => (
              <FlagCard key={i} flag={f} />
            ))}
          </div>
        </div>
      )}

      {flags.length === 0 && synergies.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No verified conflicts or synergies found for this routine's active ingredients yet.
        </p>
      )}

      {seasonalTips.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <Snowflake className="h-3.5 w-3.5" /> Seasonal notes
          </p>
          <div className="space-y-1.5">
            {seasonalTips.map((t) => (
              <p key={t.category} className="text-xs text-muted-foreground">
                {t.tip}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  routine: GroundedRoutine | null;
}

/** Insider/VIP-exclusive smart scanner: flags incompatible active pairs in a
 *  member's SKYNN AI generated routine, surfaces real synergies already
 *  present, and gives general seasonal guidance — all DB-driven via
 *  src/lib/conflictMatcher.ts, never an LLM guess. */
const ConflictMatcherPanel = ({ routine }: Props) => {
  if (!routine || (routine.am.length === 0 && routine.pm.length === 0)) return null;

  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold text-foreground">Active Ingredient Conflict Matcher</p>
      <FeatureGate
        feature="routine.conflict_matcher"
        title="Glow Insider & VIP feature"
        message="Upgrade to Glow Insider or VIP to scan this routine for incompatible actives and see what pairs well together."
      >
        <PanelBody routine={routine} />
      </FeatureGate>
    </div>
  );
};

export default ConflictMatcherPanel;
