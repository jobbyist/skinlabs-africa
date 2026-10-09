import { useId, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Gauge, Shield, Target } from "lucide-react";
import { buildTakeaways, type Takeaway } from "@/lib/starter-analysis/resultsView";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { cn } from "@/lib/utils";

const ICON: Record<Takeaway["kind"], typeof Target> = { driver: Target, barrier: Shield, pacing: Gauge };

interface SkinStoryCardProps {
  result: StarterAnalysisResult;
}

/**
 * "Your Skin Story" as three bite-sized takeaways. The full deterministic
 * narrative (always cautious, never a diagnosis) stays one tap away.
 */
const SkinStoryCard = ({ result }: SkinStoryCardProps) => {
  const [open, setOpen] = useState(false);
  const narrativeId = useId();
  const takeaways = buildTakeaways(result);
  return (
    <section aria-labelledby="skin-story-heading" className="space-y-3">
      <h4 id="skin-story-heading" className="font-heading font-semibold text-card-foreground">Your Skin Story</h4>
      <ul className="grid gap-3 sm:grid-cols-3">
        {takeaways.map((t, i) => {
          const Icon = ICON[t.kind];
          return (
            <motion.li
              key={t.kind}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.eyebrow}</p>
              <p className="mt-0.5 font-heading text-base font-semibold text-card-foreground">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
            </motion.li>
          );
        })}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={narrativeId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        Read complete analysis story
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <p id={narrativeId} className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-card-foreground animate-in fade-in-0 duration-200">
          {result.skinStory.narrative}
        </p>
      )}
    </section>
  );
};

export default SkinStoryCard;
