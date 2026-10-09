import { cn } from "@/lib/utils";
import { barrierBadge, identityTag, type HealthTone } from "@/lib/starter-analysis/resultsView";
import type { FormulaConcern } from "@/data/formulaResults";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";

const TONE_DOT: Record<HealthTone, string> = { good: "bg-emerald-500", watch: "bg-amber-500", unknown: "bg-muted-foreground" };

interface ResultsIdentityCardProps {
  skinType: string;
  concern: FormulaConcern;
  barrier: StarterAnalysisResult["profile"]["barrierTendency"];
  mst: { level: number; hex: string } | null;
  photo?: string | null;
  /** Optional extra context chips (e.g. what changed recently). */
  extra?: string[];
}

/** Identity card: one bold tag, then short badges — replaces the generic pill cluster. */
const ResultsIdentityCard = ({ skinType, concern, barrier, mst, photo, extra = [] }: ResultsIdentityCardProps) => {
  const b = barrierBadge(barrier);
  return (
    <section aria-label="Your skin identity" className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-center space-y-4">
      {photo && <img src={photo} alt="Your uploaded skin photo" className="mx-auto h-14 w-14 rounded-full border border-border object-cover" />}
      <h3 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
        {identityTag(skinType, concern)}
      </h3>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {mst && (
          <li className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
            <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: mst.hex }} aria-hidden="true" />
            MST {mst.level}
          </li>
        )}
        <li className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-full", TONE_DOT[b.tone])} aria-hidden="true" />
          {b.label}
        </li>
        {extra.map((e) => (
          <li key={e} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{e}</li>
        ))}
      </ul>
    </section>
  );
};

export default ResultsIdentityCard;
