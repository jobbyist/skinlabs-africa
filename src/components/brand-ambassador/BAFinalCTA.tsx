import { Button } from "@/components/ui/button";
import {
  BA_APPLICATIONS_CLOSE,
  BA_APPLICATIONS_OPEN,
  BA_COMMISSION_PERCENT,
  BA_SPOTS,
} from "@/data/brandAmbassador";

interface BAFinalCTAProps {
  onApply: () => void;
}

const BAFinalCTA = ({ onApply }: BAFinalCTAProps) => {
  return (
    <section className="border-t border-border bg-black py-14 text-background">
      <div className="container mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">
            {BA_SPOTS} spots. 3 months. {BA_COMMISSION_PERCENT} recurring commission.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-background/70">
            Your audience is already listening. Give them something worth discovering. Up to 10 top performers may
            later be considered for a separate, non-guaranteed 12-month partnership.
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-background/50">
            5K–50K followers required separately on TikTok and Instagram · Applications {BA_APPLICATIONS_OPEN} – {BA_APPLICATIONS_CLOSE}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Button size="lg" variant="secondary" onClick={onApply} className="bg-background text-foreground hover:bg-background/90">
            Apply Now
          </Button>
          <a href="#programme" className="text-xs text-background/60 underline underline-offset-2 hover:text-background">
            View programme details →
          </a>
        </div>
      </div>
    </section>
  );
};

export default BAFinalCTA;
