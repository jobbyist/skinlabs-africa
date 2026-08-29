import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Gift, Atom } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { membershipPlans, planPrice, annualMonthlyEquivalent, ANNUAL_MONTHS_FREE, MONEY_BACK_GUARANTEE_DAYS, type BillingInterval, type PlanId } from "@/data/plans";
import { linkifyMoneyBackGuarantee } from "@/lib/moneyBackLink";
import { startPaystackCheckout, type PaystackPlan } from "@/lib/paystack";
import { startFreeTrial } from "@/lib/trial";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingAction = { kind: "subscribe"; plan: PaystackPlan } | { kind: "trial"; plan: "insider" } | null;

const Pricing = () => {
  const { user } = useAuth();
  const { tier, trialUsed } = useMembership();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const beginCheckout = async (plan: PaystackPlan) => {
    setProcessingPlan(`subscribe-${plan}`);
    const { error } = await startPaystackCheckout(plan, interval);
    if (error) {
      setProcessingPlan(null);
      toast.error(error.message);
    }
  };

  const beginTrial = async (plan: "insider") => {
    setProcessingPlan(`trial-${plan}`);
    const { error } = await startFreeTrial(plan);
    setProcessingPlan(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your 7-day free trial is live — no card needed.");
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
    if (planId !== "insider") return;
    const plan = planId;
    if (!user) {
      setPendingAction({ kind: "trial", plan });
      setAuthOpen(true);
      return;
    }
    void beginTrial(plan);
  };

  return (
    <>
      <Helmet>
        <title>Membership Plans — SkinLabs Skincare Intelligence</title>
        <meta
          name="description"
          content="Choose a SkinLabs membership: Glow Explorer (free), Glow Insider at R99/month, or Glow VIP at R299/month. Explorer: 1 free podcast episode and 2 comparisons per month. Insider+: full library, Spotlight profiles and unlimited Shelf Showdowns."
        />
        <link rel="canonical" href="https://skinlabs.co.za/pricing" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Membership</p>
              <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
                Skincare intelligence, suitable for every budget
              </h1>
              <p className="text-muted-foreground">
                No shipping, no stock-outs, no imported markups. Just research-grounded guidance built for South
                African skin, climate and shelves — try Insider free for 7 days, no card required, and every paid
                plan comes with a{" "}
                <Link to="/terms-of-service#money-back-guarantee" className="text-primary hover:underline">
                  {MONEY_BACK_GUARANTEE_DAYS}-day money-back guarantee
                </Link>
                .
              </p>
            </div>

            <div className="mx-auto mb-12 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
              {(["monthly", "annual"] as BillingInterval[]).map((option) => (
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
                      {ANNUAL_MONTHS_FREE} months free
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {membershipPlans.map((plan, index) => {
                const price = planPrice(plan, interval);
                const isCurrentPlan = tier === plan.id;
                const isPaidPlan = plan.id !== "explorer";
                const trialAvailable = isPaidPlan && plan.trialEligible && !trialUsed && !isCurrentPlan;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className={cn(
                      "relative flex flex-col rounded-3xl border bg-card p-8",
                      plan.highlight ? "border-primary shadow-lg lg:-mt-4 lg:mb-4" : "border-border",
                    )}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        <Atom className="h-3 w-3" /> Most popular
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
                      </p>
                    )}
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
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
                          disabled={processingPlan === `trial-${plan.id}`}
                          onClick={() => handleTrial(plan.id)}
                        >
                          <Gift className="h-4 w-4" />
                          Start 7-day free trial
                        </Button>
                      )}
                      <Button
                        className="w-full"
                        variant={plan.highlight ? "default" : "outline"}
                        disabled={isCurrentPlan || processingPlan === `subscribe-${plan.id}`}
                        onClick={() => handleSelect(plan.id)}
                      >
                        {isCurrentPlan ? "Your current plan" : plan.cta}
                      </Button>
                    </div>
                    {trialAvailable && (
                      <p className="mt-3 text-center text-xs text-muted-foreground">No credit card required for the trial.</p>
                    )}
                    {isPaidPlan && plan.moneyBackDays && (
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        {linkifyMoneyBackGuarantee(`${plan.moneyBackDays}-day money-back guarantee`)}. Not right for your skin? Full refund.
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              Billed in ZAR. Cancel anytime from your dashboard. Consultations are provided by independent
              HPCSA-registered practitioners and are not a substitute for emergency medical care.
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
