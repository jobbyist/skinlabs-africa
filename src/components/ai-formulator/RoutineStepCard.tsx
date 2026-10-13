import { Link } from "react-router-dom";
import { ArrowRight, Droplets, Lock, Shield, Sparkles, Sun, Star } from "lucide-react";
import { overallScore } from "@/data/reviews";
import type { GroundedPick } from "@/lib/skynnProductMatch";
import { stepMeta, type StepIcon } from "@/lib/starter-analysis/resultsView";

const ICONS: Record<StepIcon, typeof Droplets> = { droplets: Droplets, sparkles: Sparkles, shield: Shield, sun: Sun };

interface RoutineStepCardProps {
  index: number;
  slot: string;
  /** Undefined when no reviewed product matched (or products are not unlocked for this member). */
  pick?: GroundedPick;
  /** False = named products are an Insider/VIP capability; show the step without them. */
  productsUnlocked: boolean;
}

/** One routine step: number pill + icon, the grounded product (brand, name, score, price, review link) and a one-line tip. */
const RoutineStepCard = ({ index, slot, pick, productsUnlocked }: RoutineStepCardProps) => {
  const meta = stepMeta(slot);
  const Icon = ICONS[meta.icon];
  const p = pick?.product;
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
          {String(index).padStart(2, "0")}
        </span>
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h5 className="font-heading text-sm font-semibold text-card-foreground">{meta.verb}</h5>
        <span className="text-xs text-muted-foreground">{slot === "SPF" ? "Sunscreen" : slot}</span>
      </div>

      {p && productsUnlocked ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-muted/50 p-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{p.brand}</p>
            <p className="text-sm font-medium text-card-foreground">{p.product_name}</p>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current text-primary" aria-hidden="true" />{overallScore(p).toFixed(1)}/10</span>
              <span>R{p.local_price_zar}</span>
            </p>
          </div>
          <Link
            to={`/reviews/${p.id}`}
            aria-label={`Read the SkinLabs review of ${p.brand} ${p.product_name}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Review <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : p ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          A SkinLabs-reviewed pick is matched for this step — shown to Glow Insider and VIP members.
        </p>
      ) : null}

      <p className="mt-3 text-sm font-semibold text-card-foreground">{meta.tip}</p>
    </li>
  );
};

export default RoutineStepCard;
