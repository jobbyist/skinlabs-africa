import { BookOpenText } from "lucide-react";
import { usePricingConfig } from "@/lib/pricing-config";

/**
 * "About Your Skin Analysis" — Section 2's repositioning copy, live on the
 * results screen with real Analysis Pass pricing pulled from credit_packs
 * (the same DB-driven source the Pricing page checkout already reads), so
 * this can never quote a stale price. The markdown/PDF export carries a
 * simpler, non-priced version of this same copy (see formulaResults.ts) —
 * this on-screen version is filtered out of the generic card grid to avoid
 * showing both.
 */
const AboutYourAnalysisSection = () => {
  const { data: config } = usePricingConfig();
  const packs = [...(config?.creditPacks ?? [])].sort((a, b) => a.credits - b.credits);
  const single = packs.find((p) => p.credits === 1);
  const bundle = packs.length > 1 ? packs[packs.length - 1] : null;

  const passLine =
    single && bundle
      ? `Choose 1 analysis for R${single.price} or save with ${bundle.credits} analyses for R${bundle.price}.`
      : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpenText className="h-4.5 w-4.5 text-primary shrink-0" />
        <h4 className="font-heading font-semibold text-card-foreground">About Your Skin Analysis</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Your personalised SkinLabs Starter Analysis has been created from the information you shared about your
        skin, concerns, goals and preferences.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        We've used these insights to create a practical starting point for your skincare journey, with
        recommendations selected around your priorities, preferred routine complexity and budget.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Want to explore your skin in greater depth? As a Glow Explorer, you can unlock an Advanced Skin Analysis
        whenever you need one — from just R{single?.price ?? 25} per analysis. {passLine}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        For an even more connected experience, SkinLabs Insider and VIP members unlock deeper AI-powered analysis,
        more personalised recommendations and ongoing skin intelligence designed to evolve with your skin over time.
      </p>
    </div>
  );
};

export default AboutYourAnalysisSection;
