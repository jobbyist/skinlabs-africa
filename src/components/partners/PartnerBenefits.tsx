import { motion, useReducedMotion } from "framer-motion";
import { partnerBenefits } from "@/data/partnerPrograms";

const PartnerBenefits = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
            More Than Another Advertising Channel.
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            SkinLabs® is designed to help consumers discover, understand and confidently choose skincare. Our
            partnership ecosystem gives brands meaningful ways to participate in that journey — without
            compromising the independent, consumer-first experience we are building.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partnerBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.eyebrow}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <benefit.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">{benefit.eyebrow}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBenefits;
