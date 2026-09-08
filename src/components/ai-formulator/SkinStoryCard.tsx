import { motion } from "framer-motion";
import { BookOpenText, Droplets, Shield, Sparkles, TrendingUp } from "lucide-react";
import type { SkinStory } from "@/lib/starter-analysis/types";

interface SkinStoryCardProps {
  skinStory: SkinStory;
}

const SENSITIVITY_LABEL: Record<SkinStory["sensitivityTendency"], string> = {
  low: "Low sensitivity",
  moderate: "Moderate sensitivity",
  high: "High sensitivity",
};

const BARRIER_LABEL: Record<SkinStory["barrierTendency"], string> = {
  supported: "Barrier looks supported",
  needs_support: "Barrier needs support",
  uncertain: "Barrier status unclear",
};

const BEHAVIOUR_LABEL: Record<SkinStory["skinBehaviour"], string> = {
  stable: "Fairly stable skin",
  variable: "Skin that's been changing",
  reactive: "Reactive skin",
};

/**
 * "Your Skin Story" (Section 4) — a deterministic narrative rendered from the
 * structured SkinStory object, never hard-coded per-scenario copy. Always
 * cautious ("suggests"/"appears"), never a diagnosis.
 */
const SkinStoryCard = ({ skinStory }: SkinStoryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/40 to-transparent p-5 sm:p-6"
  >
    <div className="flex items-center gap-2 mb-3">
      <BookOpenText className="h-4.5 w-4.5 text-primary shrink-0" />
      <h4 className="font-heading font-semibold text-card-foreground">Your Skin Story</h4>
    </div>
    <p className="text-sm text-card-foreground leading-relaxed">{skinStory.narrative}</p>
    <div className="flex flex-wrap gap-2 mt-4">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
        <Shield className="h-3 w-3 text-primary" />
        {SENSITIVITY_LABEL[skinStory.sensitivityTendency]}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
        <Droplets className="h-3 w-3 text-primary" />
        {BARRIER_LABEL[skinStory.barrierTendency]}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
        <TrendingUp className="h-3 w-3 text-primary" />
        {BEHAVIOUR_LABEL[skinStory.skinBehaviour]}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground capitalize">
        <Sparkles className="h-3 w-3 text-primary" />
        {skinStory.routineMaturity} routine
      </span>
    </div>
  </motion.div>
);

export default SkinStoryCard;
