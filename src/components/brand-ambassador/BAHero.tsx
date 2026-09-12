import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BA_APPLICATIONS_CLOSE,
  BA_APPLICATIONS_OPEN,
  BA_COMMISSION_PERCENT,
  BA_SPOTS,
} from "@/data/brandAmbassador";

interface BAHeroProps {
  onApply: () => void;
}

const Metric = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{value}</p>
    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

const BAHero = ({ onApply }: BAHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div
        className="pointer-events-none absolute -right-24 -top-24 hidden h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl sm:block"
        aria-hidden="true"
      />
      <div className="container relative mx-auto max-w-6xl px-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          SkinLabs® Creator Programme
        </p>
        <h1 className="mt-3 max-w-3xl text-balance font-heading text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
          Become a SkinLabs® Brand Ambassador
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          We're looking for {BA_SPOTS} TikTok and Instagram creators to help shape the next chapter of skincare
          discovery in South Africa.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Join SkinLabs® as a Brand Ambassador, Affiliate and Content Creator. Earn {BA_COMMISSION_PERCENT} recurring
          monthly commission on successful referrals while building a relationship with a growing skincare platform.
        </p>

        <div className="mt-8 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
          <Metric value={String(BA_SPOTS)} label="Creator spots" />
          <Metric value="5K–50K" label="TikTok followers" />
          <Metric value="5K–50K" label="Instagram followers" />
          <Metric value={BA_COMMISSION_PERCENT} label="Recurring commission" />
        </div>
        <p className="mt-3 max-w-xl text-xs text-muted-foreground">
          Follower requirements apply separately to each platform — combined counts do not qualify.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onApply} className="gap-2">
            Apply Now
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Applications open {BA_APPLICATIONS_OPEN} — close {BA_APPLICATIONS_CLOSE}
        </p>
      </div>
    </section>
  );
};

export default BAHero;
