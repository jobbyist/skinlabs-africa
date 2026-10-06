import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CircleUserRound, Flag, Sparkles, Sun, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trackConversionEvent } from "@/lib/analytics-events";
import { MST_SCALE } from "@/data/mstScale";
import { cn } from "@/lib/utils";

/**
 * Homepage SKYNN AI launchpad.
 *
 * Deliberately light: it imports no chart, PDF or quiz code (the quiz lives at
 * /skynn-ai and loads only after the CTA), so the homepage doesn't ship the
 * analysis dependencies. The 4-step preview is illustrative only: every
 * "example" below is generic and labelled as such, never a result or a claim.
 */

const STEP_INTERVAL_MS = 3200;

const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <span key={item} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80">
        {item}
      </span>
    ))}
  </div>
);

const STEPS: {
  label: string;
  detail: string;
  icon: typeof Sun;
  preview: ReactNode;
}[] = [
  {
    label: "Skin Tone",
    detail: "A more personal starting point",
    icon: CircleUserRound,
    preview: (
      <div>
        <div className="flex gap-1" aria-hidden="true">
          {MST_SCALE.map((swatch) => (
            <span
              key={swatch.level}
              className="h-7 flex-1 rounded-md border border-black/10 first:rounded-l-xl last:rounded-r-xl"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Optional. You choose the tone that matches you; it is never guessed from a photo.</p>
      </div>
    ),
  },
  {
    label: "Primary Concern",
    detail: "What matters most to your skin",
    icon: Target,
    preview: <Chips items={["Breakouts", "Dryness", "Uneven tone", "Sensitivity"]} />,
  },
  {
    label: "Desired Outcomes",
    detail: "The results you're working towards",
    icon: Flag,
    preview: <Chips items={["Clearer-looking skin", "More even tone", "Comfortable hydration", "A simpler routine"]} />,
  },
  {
    label: "Tailored Routine",
    detail: "Practical next steps built around you",
    icon: Sparkles,
    preview: (
      <div className="space-y-1.5 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Example layout</p>
        <p className="rounded-lg bg-muted/70 px-3 py-2"><span className="font-semibold">AM</span> · Cleanse · Moisturise · Sunscreen</p>
        <p className="rounded-lg bg-muted/70 px-3 py-2"><span className="font-semibold">PM</span> · Cleanse · Treat · Moisturise</p>
      </div>
    ),
  },
];

const TRUST_POINTS = ["Free to start", "Built for South African skin + climate", "About 2 minutes"];

const SkyNNLaunchpadCard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  // Once someone taps a step they're driving; stop auto-advancing for good.
  const [userControlled, setUserControlled] = useState(false);
  const root = useRef<HTMLElement>(null);

  // Only animate while on screen (no timers burning on a card nobody is looking at).
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || userControlled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActiveStep((s) => (s + 1) % STEPS.length), STEP_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [visible, paused, userControlled, activeStep]);

  const handleStart = () => {
    trackConversionEvent("skynn_cta_clicked", {
      source: "homepage_launchpad",
      kind: "skynn_launchpad",
    });
  };

  return (
    <section
      ref={root}
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

            <h2
              id="skynn-launchpad-title"
              className="mt-5 max-w-xl text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Your skin. Your climate. Your routine.
            </h2>

            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-secondary-text sm:text-lg">
              Answer four quick layers of questions and get a clearer skin profile with practical guidance built around you.
            </p>

            <div className="mt-6">
              <Button asChild size="lg" className="h-auto min-h-12 w-full justify-between gap-3 whitespace-normal px-6 py-3 text-left text-base sm:w-auto sm:justify-center">
                <Link to="/skynn-ai" onClick={handleStart}>
                  <span>Start Your 2-Minute Basic AI Skin Analysis</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {TRUST_POINTS.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="bg-muted/25 p-5 sm:p-7 lg:p-10"
            onPointerDown={() => setPaused(true)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">See how it comes together</p>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                Step {activeStep + 1} of {STEPS.length}
              </span>
            </div>

            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {STEPS.map((step, index) => (
                <span key={step.label} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className={cn(
                      "block h-full rounded-full bg-primary transition-[width] ease-out",
                      index < activeStep ? "w-full duration-300" : index === activeStep ? "w-full duration-500" : "w-0 duration-200",
                    )}
                  />
                </span>
              ))}
            </div>

            <ol className="mt-4 space-y-2.5" aria-label="SKYNN AI analysis preview">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = index === activeStep;
                return (
                  <li key={step.label}>
                    <button
                      type="button"
                      aria-current={active ? "step" : undefined}
                      onClick={() => {
                        setUserControlled(true);
                        setActiveStep(index);
                      }}
                      className={cn(
                        "flex w-full rounded-2xl border p-3.5 text-left transition-[background-color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4",
                        active
                          ? "border-primary/30 bg-background shadow-[var(--shadow-xs)]"
                          : "border-transparent bg-background/55 hover:border-border hover:bg-background",
                      )}
                    >
                      <span className="flex w-full items-center gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{step.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">{step.detail}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            active ? "border-primary/30 text-primary" : "border-border text-muted-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                      </span>

                    </button>
                  </li>
                );
              })}
            </ol>

            {/* One panel with a fixed minimum height: the rows above never move, so a tap can't land
                on the wrong step while the preview auto-advances. */}
            <div
              aria-live="polite"
              className="mt-3 min-h-[9.5rem] rounded-2xl border border-border/70 bg-background p-4"
            >
              <p className="eyebrow mb-3">
                Step {activeStep + 1} · {STEPS[activeStep].label}
              </p>
              <div key={activeStep} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                {STEPS[activeStep].preview}
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Tap any step to preview it. The analysis opens only when you choose to start.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkyNNLaunchpadCard;
