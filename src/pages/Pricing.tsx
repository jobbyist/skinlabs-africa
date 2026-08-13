import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tier } = useMembership();
  const [authOpen, setAuthOpen] = useState(false);

  const plans = [
    {
      id: "explorer",
      name: t("pricing.explorer.name"),
      price: 0,
      tagline: t("pricing.explorer.tagline"),
      features: [
        t("pricing.explorer.feature1"),
        t("pricing.explorer.feature2"),
        t("pricing.explorer.feature3"),
        t("pricing.explorer.feature4"),
      ],
      cta: t("pricing.explorer.cta"),
    },
    {
      id: "insider",
      name: t("pricing.insider.name"),
      price: 99,
      tagline: t("pricing.insider.tagline"),
      highlight: true,
      features: [
        t("pricing.insider.feature1"),
        t("pricing.insider.feature2"),
        t("pricing.insider.feature3"),
        t("pricing.insider.feature4"),
        t("pricing.insider.feature5"),
        t("pricing.insider.feature6"),
      ],
      cta: t("pricing.insider.cta"),
    },
    {
      id: "vip",
      name: t("pricing.vip.name"),
      price: 299,
      tagline: t("pricing.vip.tagline"),
      features: [
        t("pricing.vip.feature1"),
        t("pricing.vip.feature2"),
        t("pricing.vip.feature3"),
        t("pricing.vip.feature4"),
        t("pricing.vip.feature5"),
      ],
      cta: t("pricing.vip.cta"),
    },
  ];

  const handleSelect = (planId: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    trackEvent("subscription_checkout_started", { plan: planId, source: "pricing" });
    window.location.href = `/get-started?plan=${planId}`;
  };

  return (
    <>
      <Helmet>
        <title>Membership Plans — SkinLabs Skincare Intelligence</title>
        <meta
          name="description"
          content="Choose a SkinLabs membership: Glow Explorer (free), Glow Insider at R99/month for unlimited AI routines and newsroom access, or Glow VIP at R299/month with virtual derm consults."
        />
        <link rel="canonical" href="https://skinlabs.co.za/pricing" />
        <meta property="og:title" content="Membership Plans — SkinLabs" />
        <meta property="og:description" content="AI skincare routines, daily skincare news and virtual derm consults, priced in rands." />
        <meta property="og:url" content="https://skinlabs.co.za/pricing" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">{t("pricing.eyebrow")}</p>
              <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
                {t("pricing.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("pricing.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan, index) => (
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
                      <Sparkles className="h-3 w-3" /> {t("pricing.mostPopular")}
                    </span>
                  )}
                  <h2 className="font-heading text-xl font-bold text-foreground">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-heading text-4xl font-extrabold text-foreground">R{plan.price}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{t("pricing.perMonth")}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={tier === plan.id}
                    onClick={() => handleSelect(plan.id)}
                  >
                    {tier === plan.id ? t("pricing.yourCurrentPlan") : plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              Billed monthly in ZAR. Cancel anytime from your dashboard. Consultations are provided by independent
              HPCSA-registered practitioners and are not a substitute for emergency medical care.
            </p>
          </div>
        </main>
        <Footer />
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Pricing;
