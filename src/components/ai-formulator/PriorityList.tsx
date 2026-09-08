import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
import type { PriorityResult } from "@/lib/starter-analysis/types";

interface PriorityListProps {
  priorities: PriorityResult;
}

const LEVEL_STYLE: Record<string, string> = {
  high: "bg-primary text-primary-foreground",
  moderate: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

/**
 * "Your Top Skin Priorities" (Section 7) — output of the deterministic
 * Priority Engine, never just the order the visitor answered questions in.
 * Each item's "why" is a plain-language rendering of the weighting rule that
 * produced it, expandable so the ranking doesn't feel arbitrary.
 */
const PriorityList = ({ priorities }: PriorityListProps) => {
  const [expanded, setExpanded] = useState<number | null>(priorities.items[0]?.rank ?? null);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <ListOrdered className="h-4.5 w-4.5 text-primary shrink-0" />
        <h4 className="font-heading font-semibold text-card-foreground">Your Top Skin Priorities</h4>
      </div>
      <div className="space-y-2">
        {priorities.items.map((item, idx) => {
          const isOpen = expanded === item.rank;
          return (
            <motion.button
              key={item.key}
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              onClick={() => setExpanded(isOpen ? null : item.rank)}
              className="w-full text-left rounded-xl border border-border hover:border-primary/40 transition-colors p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-secondary/60 text-xs font-bold text-muted-foreground flex items-center justify-center shrink-0">
                    {item.rank}
                  </span>
                  <span className="font-medium text-card-foreground text-sm">{priorityLabel(item.key)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium capitalize", LEVEL_STYLE[item.level])}>
                    {item.level}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </div>
              {isOpen && <p className="text-xs text-muted-foreground mt-2 pl-9 leading-relaxed">{item.reason}</p>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityList;
