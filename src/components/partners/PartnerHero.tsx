import { motion, useReducedMotion } from "framer-motion";
import { Compass, BookOpen, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PartnerHeroProps {
  onBookCall: () => void;
  onExploreModels: () => void;
}

const PATHWAY = [
  { label: "Discovery", icon: Compass },
  { label: "Education", icon: BookOpen },
  { label: "Trust", icon: ShieldCheck },
  { label: "Commerce", icon: ShoppingBag },
];

const PartnerHero = ({ onBookCall, onExploreModels }: PartnerHeroProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background pb-20 pt-32 md:pb-28 md:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div className="container relative mx-auto max-w-5xl px-4 text-center">
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary"
        >
          SkinLabs® Partner Program
        </motion.p>

        <motion.h1
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-balance font-heading text-4xl font-bold leading-[1.08] text-foreground md:text-6xl"
        >
          Build Something Bigger With SkinLabs®
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl"
        >
          SkinLabs® connects consumers with trusted skincare products, brands, professionals and knowledge. Our
          Partner Program gives ambitious brands and businesses multiple ways to participate in the ecosystem —
          from performance-based affiliate partnerships to deeper editorial and strategic commerce collaborations.
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" className="w-full sm:w-auto" onClick={onBookCall}>
            Book a Partnership Call
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={onExploreModels}>
            Explore Partnership Models
          </Button>
        </motion.div>

        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          Partnerships are tailored to your brand, audience and objectives.
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="relative flex items-center justify-between">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-transparent via-border to-transparent md:top-7"
            />
            {PATHWAY.map((step, index) => (
              <div key={step.label} className="relative flex flex-1 flex-col items-center gap-3">
                <motion.div
                  initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.12 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-sm md:h-14 md:w-14"
                >
                  <step.icon className="h-5 w-5 text-primary md:h-6 md:w-6" aria-hidden="true" />
                </motion.div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerHero;
