import { motion, useReducedMotion } from "framer-motion";
import { partnerPrinciples } from "@/data/partnerPrograms";

const PartnershipPrinciples = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bg-foreground py-20 text-background md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-background md:text-4xl">
            Built on Trust. Designed for Growth.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-background/15 bg-background/15 sm:grid-cols-2 lg:grid-cols-3">
          {partnerPrinciples.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
              className="bg-foreground p-7"
            >
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-background">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-background/70">{principle.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnershipPrinciples;
