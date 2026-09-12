import { ArrowRight, CalendarCheck, Send, Users, Search } from "lucide-react";
import { BA_APPLICATIONS_CLOSE, BA_PROGRAMME_START, type ApplicationWindowStatus } from "@/data/brandAmbassador";

interface BAHowItWorksProps {
  onApply: () => void;
  status: ApplicationWindowStatus;
}

const steps = [
  { number: "01", icon: Send, title: "Apply", description: `Submit your creator profile before ${BA_APPLICATIONS_CLOSE}.` },
  { number: "02", icon: Search, title: "Get Reviewed", description: "The SkinLabs® team reviews applications for content, audience and programme fit." },
  { number: "03", icon: Users, title: "Get Selected", description: "25 creators are selected for the founding cohort." },
  { number: "04", icon: CalendarCheck, title: "Start Creating", description: `The initial 3-month programme begins ${BA_PROGRAMME_START}.` },
];

const BAHowItWorks = ({ onApply, status }: BAHowItWorksProps) => {
  return (
    <section id="how-it-works" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">How It Works</p>
        <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
          A simple 4-step process
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              <p className="font-heading text-sm font-bold text-indigo-600">{step.number}</p>
              <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <step.icon className="h-5 w-5 text-foreground" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-foreground">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              {i === 0 && status === "open" && (
                <button
                  type="button"
                  onClick={onApply}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
                >
                  Apply now <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {i === 0 && status !== "open" && (
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  {status === "before" ? "Applications not yet open" : "Applications closed"}
                </p>
              )}
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-5 top-6 hidden h-4 w-4 text-border lg:block" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          Top-performing ambassadors who meet or exceed the applicable quota may later be considered for a separate,
          non-guaranteed 12-month partnership — see Performance Opportunity below.
        </p>
      </div>
    </section>
  );
};

export default BAHowItWorks;
