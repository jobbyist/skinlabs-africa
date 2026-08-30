import { motion, useReducedMotion } from "framer-motion";
import { processSteps } from "@/data/partnerPrograms";

const PartnerProcess = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bg-secondary/10 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">How It Works</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            We start with a conversation. Our team will understand your objectives, audience, products and
            preferred level of collaboration before recommending the most appropriate partnership structure.
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block"
          />
          {processSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative flex flex-col items-start gap-4"
            >
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background font-heading text-sm font-bold text-primary">
                {step.number}
              </span>
              <h3 className="font-heading text-lg font-bold text-foreground">{step.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerProcess;
