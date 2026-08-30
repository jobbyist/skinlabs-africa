import { motion, useReducedMotion } from "framer-motion";
import { partnerTypes } from "@/data/partnerPrograms";

const PartnerTypes = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
            Who We Partner With
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partnerTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
              className="rounded-2xl border border-border p-6"
            >
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                {type.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{type.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerTypes;
