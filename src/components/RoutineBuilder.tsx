import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { productReviews, overallScore, type ProductReview } from "@/data/reviews";
import GatedOverlay from "@/components/GatedOverlay";

/** The routine slots the builder tries to fill, in application order. */
const ROUTINE_STEPS = ["Cleanser", "Serum", "Moisturiser", "Sunscreen", "Eye Cream"] as const;

const STEP_TIME: Record<(typeof ROUTINE_STEPS)[number], string> = {
  Cleanser: "AM & PM",
  Serum: "AM & PM",
  Moisturiser: "AM & PM",
  Sunscreen: "AM",
  "Eye Cream": "PM",
};

const skinTypeMatches = (a: string[], b: string[]) =>
  a.includes("All") || b.includes("All") || a.some((type) => b.includes(type));

/**
 * Picks the single best-scoring product in `category` whose skin-type match overlaps
 * with `anchor` — never the anchor product itself. Ties broken by SA climate fit, since
 * that's the axis most specific to local conditions and least likely to already be
 * reflected in a plain overall-score sort.
 */
const pickBestForCategory = (category: string, anchor: ProductReview): ProductReview | null => {
  const candidates = productReviews.filter((p) => p.category === category && p.id !== anchor.id);
  const matched = candidates.filter((p) => skinTypeMatches(p.skin_type_match, anchor.skin_type_match));
  const pool = matched.length > 0 ? matched : candidates;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => overallScore(b) - overallScore(a) || b.score_climate - a.score_climate)[0];
};

interface RoutineBuilderProps {
  anchor: ProductReview;
  isVip: boolean;
}

/**
 * Intelligent Routine Builder (Glow VIP): assembles a complete routine around the
 * product being viewed by picking the highest-scoring, skin-type-matched product
 * SkinLabs has reviewed for every other step — never a fabricated or paid pick, just
 * the same review data the rest of the site is built on, applied to this one product.
 */
const RoutineBuilder = ({ anchor, isVip }: RoutineBuilderProps) => {
  const steps = ROUTINE_STEPS.map((category) => {
    const product = category === anchor.category ? anchor : pickBestForCategory(category, anchor);
    return product ? { category, product, isAnchor: product.id === anchor.id } : null;
  }).filter((step): step is { category: (typeof ROUTINE_STEPS)[number]; product: ProductReview; isAnchor: boolean } => step !== null);

  if (steps.length < 2) return null;

  const totalCost = steps.reduce((sum, step) => sum + step.product.local_price_zar, 0);

  return (
    <div className="mt-8">
      <GatedOverlay
        locked={!isVip}
        title="Glow VIP unlocks the Routine Builder"
        message="Build a complete routine around this exact product — cleanser, serum, moisturiser, SPF and eye care, each the highest-scoring skin-type match from every product SkinLabs has reviewed."
        ctaLabel="Go VIP"
        ctaHref="/pricing"
      >
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">Your Intelligent Routine Builder</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Built around {anchor.product_name} — every other step is the highest-scoring, skin-type-matched product
            in our review set, not a fabricated or paid recommendation.
          </p>

          <ol className="mt-5 space-y-2.5">
            {steps.map((step, index) => (
              <li key={step.category}>
                <Link
                  to={`/reviews/${step.product.id}`}
                  className={
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors " +
                    (step.isAnchor ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary")
                  }
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {step.category} · {STEP_TIME[step.category]}
                      {step.isAnchor && " · This product"}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {step.product.brand} {step.product.product_name}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-col items-center rounded-lg bg-primary px-2 py-1 text-primary-foreground">
                    <span className="font-heading text-sm font-extrabold leading-none">{overallScore(step.product)}</span>
                    <span className="text-[8px] uppercase">/10</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Estimated routine cost</span>
            <span className="font-semibold text-foreground">R{totalCost.toFixed(0)}</span>
          </div>
        </div>
      </GatedOverlay>
    </div>
  );
};

export default RoutineBuilder;
