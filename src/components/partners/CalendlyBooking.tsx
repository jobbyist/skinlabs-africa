import { motion, useReducedMotion } from "framer-motion";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const CALENDLY_URL = (import.meta.env.VITE_SKINLABS_CALENDLY_URL as string | undefined)?.trim();
const CONTACT_EMAIL = "partners@skinlabs.co.za";

const benefits = [
  "A 20–30 minute conversation about your business and objectives",
  "A recommendation on the partnership model that fits best",
  "A clear next step — whether that's a proposal, an integration plan or an introduction to the right person on our team",
];

const CalendlyBooking = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Book a call</p>
        <h3 className="mt-3 text-balance font-heading text-2xl font-bold text-foreground md:text-3xl">
          Pick a time that works for you
        </h3>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Have a partnership idea? Tell us what you're building, what you're looking to achieve and how you'd
          like to work with SkinLabs®. Our team will recommend the most appropriate path forward.
        </p>
        <ul className="mt-6 space-y-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground/85">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-xl border border-border bg-secondary/20 p-5">
          <p className="text-sm text-muted-foreground">Prefer email? Contact the SkinLabs® Partnerships Team.</p>
          <Button variant="outline" asChild className="mt-3 gap-2">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="min-h-[600px] overflow-hidden rounded-2xl border border-border bg-card"
      >
        {CALENDLY_URL ? (
          <iframe
            src={CALENDLY_URL}
            title="Book a SkinLabs® Partnership Call via Calendly"
            className="h-full min-h-[600px] w-full"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-medium text-foreground">Scheduling link coming soon</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Our online booking calendar isn't connected yet. In the meantime, email our Partnerships Team and
              we'll set up a time directly.
            </p>
            <Button asChild className="mt-2 gap-2">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email {CONTACT_EMAIL}
              </a>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CalendlyBooking;
