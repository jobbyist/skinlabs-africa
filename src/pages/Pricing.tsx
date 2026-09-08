import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Gift, Atom, Sparkles, Crown, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import {
  usePricingConfig,
  planPrice,
  annualMonthlyEquivalent,
  annualSavingsLabel,
  type PricingPlan,
} from "@/lib/pricing-config";
import { membershipPlans as fallbackPlans, type BillingInterval, type PlanId } from "@/data/plans";
import { linkifyMoneyBackGuarantee } from "@/lib/moneyBackLink";
import { startPaystackCheckout, startCreditPackCheckout, startFoundingMemberCheckout, type PaystackPlan } from "@/lib/paystack";
import { startFreeTrial } from "@/lib/trial";
import { trackConversionEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingAction =
  | { kind: "subscribe"; plan: PaystackPlan }
  | { kind: "trial"; plan: "insider" | "glow_lite" }
  | null;

const Pricing = () => {
  const { user } = useAuth();
  const { tier, trialUsed } = useMembership();
  const { data: config, isLoading: configLoading } = usePricingConfig();
  const [interval, setIntervalState] = useState<BillingInterval>("annual");
  const [intervalTouched, setIntervalTouched] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const variantKey = config?.variantKey ?? "control";

  // Annual-first, but let the visitor's explicit choice win once they've made one.
  useEffect(() => {
    if (!intervalTouched && config?.settings.default_billing_interval) {
      setIntervalState(config.settings.default_billing_interval as BillingInterval);
    }
  }, [config?.settings.default_billing_interval, intervalTouched]);

  const setInterval = (value: BillingInterval) => {
    setIntervalTouched(true);
    setIntervalState(value);
  };

  useEffect(() => {
    trackConversionEvent("pricing_view");
  }, []);

  useEffect(() => {
    if (config?.creditPacks.length) trackConversionEvent("credit_pack_viewed");
  }, [config?.creditPacks.length]);

  useEffect(() => {
    if (config?.foundingOffer) {
      trackConversionEvent("founding_member_viewed", { offerId: config.foundingOffer.id });
    }
  }, [config?.foundingOffer]);

  // Fall back to static plan data (src/data/plans.ts) only if the DB fetch genuinely
  // failed — this keeps the page from rendering blank, it is never the priced source.
  const plans: PricingPlan[] = useMemo(() => {
    if (config?.plans.length) return config.plans;
    return fallbackPlans.map((p) => ({
      plan_id: p.id,
      variant_key: "control",
      name: p.name,
      tagline: p.tagline,
      price_monthly: p.priceMonthly,
      price_annual: p.priceAnnual,
      trial_days: p.trialDays ?? 0,
      trial_eligible: p.trialEligible,
      is_purchasable: p.isPurchasable,
      cta_label: p.cta,
      cta_override: p.ctaOverride ?? null,
      badge: p.highlight ? "Most popular" : null,
      money_back_days: p.moneyBackDays ?? null,
      benefits: p.features,
      sort_order: 0,
      updated_at: new Date().toISOString(),
    }));
  }, [config?.plans]);

  const beginCheckout = async (plan: PaystackPlan) => {
    setProcessingPlan(`subscribe-${plan}`);
    trackConversionEvent("plan_selected", { plan, interval });
    const { error } = await startPaystackCheckout(plan, interval, variantKey);
    if (error) {
      setProcessingPlan(null);
      toast.error(error.message);
    }
  };

  const beginTrial = async (plan: "insider" | "glow_lite") => {
    setProcessingPlan(`trial-${plan}`);
    const { error } = await startFreeTrial(plan, variantKey);
    setProcessingPlan(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your free trial is live — no card needed.");
    window.location.href = "/dashboard?trial=started";
  };

  const runPendingAction = (action: PendingAction) => {
    if (!action) return;
    if (action.kind === "subscribe") void beginCheckout(action.plan);
    else void beginTrial(action.plan);
  };

  const handleSelect = (planId: PlanId) => {
    if (planId === "explorer") {
      if (!user) setAuthOpen(true);
      else window.location.href = "/dashboard";
      return;
    }
    const plan = planId as PaystackPlan;
    if (!user) {
      setPendingAction({ kind: "subscribe", plan });
      setAuthOpen(true);
      return;
    }
    void beginCheckout(plan);
  };

  const handleTrial = (planId: PlanId) => {
    if (planId !== "insider" && planId !== "glow_lite") return;
    const plan = planId;
    if (!user) {
      setPendingAction({ kind: "trial", plan });
      setAuthOpen(true);
      return;
    }
    void beginTrial(plan);
  };

  const handleBuyCreditPack = async (packId: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setProcessingPlan(`credit-${packId}`);
    const { error } = await startCreditPackCheckout(packId, variantKey);
    if (error) {
      setProcessingPlan(null);
      toast.error(error.message);
    }
  };

  const handleBuyFoundingMember = async () => {
    if (!config?.foundingOffer) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setProcessingPlan("founding-member");
    const { error } = await startFoundingMemberCheckout(config.foundingOffer.id);
    if (error) {
      setProcessingPlan(null);
      toast.error(error.message);
    }
  };

  const founding = config?.foundingOffer;
  const foundingSpotsLeft = founding ? Math.max(founding.member_cap - founding.redeemed_count, 0) : 0;
  const foundingAvailable = Boolean(founding) && foundingSpotsLeft > 0;

  return (
    <>
      <Helmet>
        <title>SkinLabs® Membership | Personalised Skincare Intelligence</title>
        <meta
          name="description"
          content="Join SkinLabs® for personalised skincare intelligence, AI-powered routines and exclusive member benefits. Glow Explorer free; Glow Lite from R39/month; Insider from R99/month."
        />
        <link rel="canonical" href="https://skinlabs.co.za/pricing" />
        <meta property="og:title" content="SkinLabs® Membership | Personalised Skincare Intelligence" />
        <meta
          property="og:description"
          content="Personalised skincare intelligence, AI-powered routines and exclusive member benefits. Glow Explorer free; Glow Lite from R39/month; Insider from R99/month."
        />
        <meta property="og:url" content="https://skinlabs.co.za/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Membership</p>
              <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
                A routine that gets smarter the longer you use it
              </h1>
              <p className="text-muted-foreground">
                No shipping, no stock-outs, no imported markups — research-grounded guidance built for South
                African skin, climate and shelves. Start free, upgrade only once you're getting real value.
              </p>
            </div>

            {configLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!configLoading && (
              <>
                <div className="mx-auto mb-12 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
                  {(["annual", "monthly"] as BillingInterval[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setInterval(option)}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                        interval === option
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option === "monthly" ? "Monthly" : "Annual"}
                      {option === "annual" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            interval === "annual" ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                          )}
                        >
                          Best value
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                  {plans.map((plan, index) => {
                    const price = planPrice(plan, interval);
                    const isPaidPlan = plan.plan_id !== "explorer";
                    const isCurrentPlan = tier === plan.plan_id;
                    const trialAvailable =
                      isPaidPlan && plan.trial_eligible && plan.trial_days > 0 && !trialUsed && !isCurrentPlan;
                    const savings = isPaidPlan && interval === "annual" ? annualSavingsLabel(plan) : null;
                    const disabled = !plan.is_purchasable && isPaidPlan;

                    return (
                      <motion.div
                        key={plan.plan_id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        className={cn(
                          "relative flex flex-col rounded-3xl border bg-card p-8",
                          plan.badge ? "border-primary shadow-lg lg:-mt-4 lg:mb-4" : "border-border",
                        )}
                      >
                        {plan.badge && (
                          <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            <Atom className="h-3 w-3" /> {plan.badge}
                          </span>
                        )}
                        <h2 className="font-heading text-xl font-bold text-foreground">{plan.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                        <div className="mt-6 flex items-end gap-1">
                          <span className="font-heading text-4xl font-extrabold text-foreground">R{price}</span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            {isPaidPlan ? (interval === "annual" ? "/year" : "/month") : ""}
                          </span>
                        </div>
                        {isPaidPlan && interval === "annual" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Works out to R{annualMonthlyEquivalent(plan)}/month, billed yearly
                            {savings ? ` — ${savings}` : ""}
                          </p>
                        )}
                        <ul className="mt-6 flex-1 space-y-3">
                          {(plan.benefits as string[]).map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              {linkifyMoneyBackGuarantee(feature)}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-8 space-y-2">
                          {trialAvailable && (
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              disabled={processingPlan === `trial-${plan.plan_id}`}
                              onClick={() => handleTrial(plan.plan_id as PlanId)}
                            >
                              <Gift className="h-4 w-4" />
                              Try free for {plan.trial_days} days
                            </Button>
                          )}
                          <Button
                            className="w-full"
                            variant={plan.badge ? "default" : "outline"}
                            disabled={disabled || isCurrentPlan || processingPlan === `subscribe-${plan.plan_id}`}
                            onClick={() => handleSelect(plan.plan_id as PlanId)}
                          >
                            {isCurrentPlan ? "Your current plan" : disabled ? (plan.cta_override ?? "Coming soon") : plan.cta_label}
                          </Button>
                        </div>
                        {trialAvailable && (
                          <p className="mt-3 text-center text-xs text-muted-foreground">
                            No card required. Prefer to skip the trial? Subscribing directly comes with the money-back
                            guarantee below from day one.
                          </p>
                        )}
                        {isPaidPlan && plan.money_back_days && (
                          <p className="mt-1 text-center text-xs text-muted-foreground">
                            {linkifyMoneyBackGuarantee(`${plan.money_back_days}-day money-back guarantee`)} when you
                            subscribe. Not right for your skin? Full refund.
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {config?.creditPacks.map((pack) => (
                  <div
                    key={pack.pack_id}
                    className="mx-auto mt-12 flex max-w-3xl flex-col items-start gap-4 rounded-3xl border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">{pack.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Not ready for a subscription? Get {pack.credits} Analysis Pass{pack.credits === 1 ? "" : "es"} for R{pack.price} —
                          {pack.expires_after_days
                            ? ` valid for ${pack.expires_after_days} days.`
                            : " they never expire."}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2 sm:w-auto"
                      disabled={processingPlan === `credit-${pack.pack_id}`}
                      onClick={() => handleBuyCreditPack(pack.pack_id)}
                    >
                      Buy for R{pack.price}
                    </Button>
                  </div>
                ))}

                {foundingAvailable && founding && (
                  <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-primary/40 bg-primary/5 p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Crown className="h-5 w-5 text-primary" />
                        </span>
                        <div>
                          <h3 className="font-heading text-lg font-bold text-foreground">{founding.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            A once-off R{founding.price}
                            {founding.duration_months ? ` for ${founding.duration_months} months` : " for lifetime"} of
                            Glow Insider — only {founding.member_cap} spots, {foundingSpotsLeft} left.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="gap-2"
                        disabled={processingPlan === "founding-member"}
                        onClick={handleBuyFoundingMember}
                      >
                        Become a Founding Member
                      </Button>
                    </div>
                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {(founding.benefits as string[]).map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <p className="mt-10 text-center text-xs text-muted-foreground">
              Billed in ZAR. Cancel any paid plan any time from your dashboard. Virtual consultations will be
              provided by independent HPCSA-registered practitioners once live, and are not a substitute for
              emergency medical care.
            </p>
          </div>
        </main>
        <Footer />
      </div>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={() => {
          const action = pendingAction;
          setPendingAction(null);
          runPendingAction(action);
        }}
      />
    </>
  );
};

export default Pricing;
