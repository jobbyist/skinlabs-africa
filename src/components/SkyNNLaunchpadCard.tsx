import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleUserRound, Sparkles, Sun, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trackConversionEvent } from "@/lib/analytics-events";

const STEPS = [
  {
    label: "Skin Tone",
    detail: "A more personal starting point",
    icon: CircleUserRound,
  },
  {
    label: "Primary Concern",
    detail: "What matters most to your skin",
    icon: Target,
  },
  {
    label: "Climate Zone",
    detail: "Your local conditions in the mix",
    icon: Sun,
  },
  {
    label: "Tailored Routine",
    detail: "Practical next steps built around you",
    icon: Sparkles,
  },
];

const SkyNNLaunchpadCard = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % STEPS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  const handleStart = () => {
    trackConversionEvent("skynn_cta_clicked", {
      source: "homepage_launchpad",
      kind: "skynn_launchpad",
    });
  };

  return (
    <section
      id="skynn-launchpad"
      aria-labelledby="skynn-launchpad-title"
      className="container mx-auto px-4 py-10 sm:py-14"
      data-skynn-launchpad-ready="true"
    >
      <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[var(--shadow-sm)]">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                SKYNN AI
              </span>
              <span className="text-xs text-muted-foreground">2-minute skin analysis</span>
            </div>

            <h2 id="skynn-launchpad-title" className="mt-5 max-w-xl font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your skin. Your climate. Your routine.
            </h2>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-secondary-text sm:text-lg">
              Answer four quick layers of questions and get a clearer skin profile with practical guidance built around you.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="min-h-12 gap-2 px-6 text-base">
                <Link to="/skynn-ai" onClick={handleStart}>
                  Start Your 2-Minute Skin Analysis
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {["Personalised for you", "Built for South African skin + climate", "No hype"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-muted/25 p-5 sm:p-7 lg:p-10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                See how it comes together
              </p>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Step {activeStep + 1} of {STEPS.length}
              </span>
            </div>

            <div className="mt-5 space-y-2.5" aria-label="SKYNN AI analysis preview">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = index === activeStep;
                return (
                  <button
                    key={step.label}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${step.label}: ${step.detail}`}
                    onClick={() => setActiveStep(index)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-500 sm:p-4 ${
                      active
                        ? "border-primary/30 bg-background shadow-[var(--shadow-xs)]"
                        : "border-transparent bg-background/55 hover:border-border hover:bg-background"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-foreground">{step.label}</span>
                        {active && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                            Now
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {step.detail}
                      </span>
                    </span>

                    <span
                      className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:flex ${
                        active ? "border-primary/30 text-primary" : "border-border text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Tap any step to preview it. The analysis itself opens only when you choose to start.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkyNNLaunchpadCard;
