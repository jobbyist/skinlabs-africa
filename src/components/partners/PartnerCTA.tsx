import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PartnerCTAProps {
  onBookCall: () => void;
  onExploreModels: () => void;
}

const PartnerCTA = ({ onBookCall, onExploreModels }: PartnerCTAProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-foreground py-20 text-background md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/10 blur-3xl"
      />
      <div className="container relative mx-auto max-w-3xl px-4 text-center">
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-sm font-semibold uppercase tracking-[0.2em] text-background/60"
        >
          Ready to partner?
        </motion.p>
        <motion.h2
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-3 text-balance font-heading text-3xl font-bold text-background md:text-5xl"
        >
          Let's Build Better Skincare Discovery Together.
        </motion.h2>
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-5 max-w-xl text-pretty text-lg text-background/70"
        >
          Whether you're looking to drive product sales, tell your brand story or build a deeper commerce
          relationship with SkinLabs®, we'd love to hear what you're working on.
        </motion.p>
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={onBookCall}>
            Book a Partnership Call
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background sm:w-auto"
            onClick={onExploreModels}
          >
            Explore Partnership Models
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerCTA;
