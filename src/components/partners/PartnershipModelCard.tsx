import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PartnershipModel } from "@/data/partnerPrograms";

interface PartnershipModelCardProps {
  model: PartnershipModel;
  index: number;
  onSelect: (modelId: PartnershipModel["id"]) => void;
}

const PartnershipModelCard = ({ model, index, onSelect }: PartnershipModelCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const inverted = model.depth === 3;

  return (
    <motion.section
      id={model.anchorId}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 28 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-[28px] border",
        inverted
          ? "border-transparent bg-foreground text-background shadow-xl"
          : model.depth === 2
            ? "border-border bg-secondary/25 shadow-sm"
            : "border-border bg-card",
      )}
    >
      <div className="grid gap-10 p-8 md:grid-cols-[minmax(0,280px)_1fr] md:p-12 lg:gap-16">
        {/* Left rail: identity */}
        <div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "font-heading text-sm font-bold tracking-widest",
                inverted ? "text-background/50" : "text-muted-foreground",
              )}
            >
              {model.number} /
            </span>
            <span
              className={cn(
                "text-sm font-semibold uppercase tracking-widest",
                inverted ? "text-background" : "text-primary",
              )}
            >
              {model.label}
            </span>
          </div>

          <div
            className={cn(
              "mt-5 flex h-12 w-12 items-center justify-center rounded-full",
              inverted ? "bg-background/10" : "bg-primary/10",
            )}
          >
            <model.icon className={cn("h-5 w-5", inverted ? "text-background" : "text-primary")} aria-hidden="true" />
          </div>

          <h3
            className={cn(
              "mt-6 text-balance font-heading text-2xl font-bold leading-tight md:text-3xl",
              inverted ? "text-background" : "text-foreground",
            )}
          >
            {model.headline}
          </h3>

          <p className={cn("mt-4 text-pretty text-sm leading-relaxed", inverted ? "text-background/70" : "text-muted-foreground")}>
            {model.shortDescription}
          </p>

          {model.depth === 3 && (
            <p
              className={cn(
                "mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                "border-background/20 text-background/80",
              )}
            >
              Deepest level of collaboration
            </p>
          )}

          <Button
            size="lg"
            variant={inverted ? "secondary" : "default"}
            className="mt-8 w-full md:w-auto"
            onClick={() => onSelect(model.id)}
          >
            {model.cta}
          </Button>
        </div>

        {/* Right: detail */}
        <div className="space-y-8">
          <p className={cn("text-pretty leading-relaxed", inverted ? "text-background/85" : "text-foreground/90")}>
            {model.detailedDescription}
          </p>

          <div>
            <p className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", inverted ? "text-background/50" : "text-muted-foreground")}>
              Best for
            </p>
            <div className="flex flex-wrap gap-2">
              {model.bestFor.map((item) => (
                <span
                  key={item}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    inverted ? "border-background/20 text-background/80" : "border-border text-foreground/80",
                  )}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", inverted ? "text-background/50" : "text-muted-foreground")}>
                {model.opportunitiesLabel}
              </p>
              <ul className="space-y-1.5">
                {model.opportunities.map((item) => (
                  <li
                    key={item}
                    className={cn("flex items-start gap-2 text-sm", inverted ? "text-background/80" : "text-foreground/80")}
                  >
                    <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", inverted ? "text-background/60" : "text-primary")} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", inverted ? "text-background/50" : "text-muted-foreground")}>
                {model.provideLabel}
              </p>
              <ul className="space-y-1.5">
                {model.mayProvide.map((item) => (
                  <li
                    key={item}
                    className={cn("flex items-start gap-2 text-sm", inverted ? "text-background/80" : "text-foreground/80")}
                  >
                    <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", inverted ? "text-background/60" : "text-primary")} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border p-5",
              inverted ? "border-background/15 bg-background/5" : "border-border bg-background/60",
            )}
          >
            <p className={cn("mb-1.5 text-xs font-semibold uppercase tracking-wider", inverted ? "text-background/50" : "text-muted-foreground")}>
              {model.commercialLabel}
            </p>
            <p className={cn("text-sm leading-relaxed", inverted ? "text-background/80" : "text-foreground/80")}>
              {model.commercialModel}
            </p>
          </div>

          <div>
            <p className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", inverted ? "text-background/50" : "text-muted-foreground")}>
              {model.guidelinesLabel}
            </p>
            <ul className={cn("space-y-2 border-l-2 pl-4", inverted ? "border-background/20" : "border-border/60")}>
              {model.guidelines.map((item) => (
                <li
                  key={item}
                  className={cn("text-xs leading-relaxed", inverted ? "text-background/60" : "text-muted-foreground")}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PartnershipModelCard;
