import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Target,
  Sparkles,
  Calendar,
  Wallet,
  Package,
  Sun,
  Moon,
  ChevronRight,
  Check,
  X,
  FlaskConical,
  TrendingUp,
  RefreshCw,
  Layers,
  Heart,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useAnalysisPassBalance } from "@/hooks/use-analysis-passes";
import { trackConversionEvent } from "@/lib/analytics-events";
import { SITE_URL } from "@/lib/seo-config";
import { cn } from "@/lib/utils";

// Smart Routines Landing Page
const SmartRoutines = () => {
  const { user } = useAuth();
  const entitlements = useEntitlements();
  const { balance: analysisPassBalance } = useAnalysisPassBalance();
  const [activeSeasonTab, setActiveSeasonTab] = useState<"summer" | "winter">("summer");

  useEffect(() => {
    trackConversionEvent("smart_routines_page_view", {
      authenticated: Boolean(user),
      tier: entitlements.ladderTier,
      hasAnalysisPass: (analysisPassBalance ?? 0) > 0,
    });
  }, [user, entitlements.ladderTier, analysisPassBalance]);

  // Determine primary CTA based on user state
  const getPrimaryCTA = () => {
    // If user already has Smart Routines access (placeholder for when feature exists)
    // This would check if user has completed Advanced Analysis
    const hasAdvancedAnalysis = false; // TODO: Check actual advanced analysis status

    if (hasAdvancedAnalysis) {
      return {
        label: "Open My Smart Routine",
        href: "/dashboard", // Would route to Smart Routines when implemented
        description: "Your personalized routine is ready",
      };
    }

    // Glow Insider or VIP - Advanced Analysis included
    if (entitlements.isInsider || entitlements.isVip) {
      return {
        label: "Start Advanced Analysis",
        href: "/skynn-ai",
        description: "Included with your membership",
      };
    }

    // Glow Explorer or Lite with Analysis Pass
    if ((entitlements.isFree || entitlements.isGlowLite) && (analysisPassBalance ?? 0) > 0) {
      return {
        label: "Use 1 Analysis Pass",
        href: "/skynn-ai",
        description: "Your Analysis Pass unlocks Advanced Skin Analysis",
      };
    }

    // Glow Explorer or Lite without Analysis Pass
    if (entitlements.isFree || entitlements.isGlowLite) {
      return {
        label: "Get Advanced Analysis",
        href: "/pricing",
        description: "From R25 with Analysis Pass",
      };
    }

    // Anonymous users
    return {
      label: "Get Your Advanced Skin Analysis",
      href: "/skynn-ai",
      description: "Start your journey to smarter skincare",
    };
  };

  const primaryCTA = getPrimaryCTA();

  const handleCTAClick = (location: string) => {
    trackConversionEvent("smart_routines_cta_clicked", {
      location,
      tier: entitlements.ladderTier,
      authenticated: Boolean(user),
      hasAnalysisPass: (analysisPassBalance ?? 0) > 0,
    });
  };

  return (
    <>
      <Helmet>
        <title>Smart Routines | Your skincare routine, finally built around you | SkinLabs®</title>
        <meta
          name="description"
          content="Smart Routines turns your Advanced SKYNN AI Skin Analysis into a living AM + PM routine that adapts to your skin, the season, your budget and the products already on your shelf."
        />
        <link rel="canonical" href={`${SITE_URL}/routines`} />
        <meta name="robots" content="index,follow" />
        <meta property="og:title" content="Smart Routines | Your skincare routine, finally built around you" />
        <meta
          property="og:description"
          content="A living AM + PM skincare routine that adapts to your skin profile, the season, your budget and your existing products — powered by SKYNN AI."
        />
        <meta property="og:url" content={`${SITE_URL}/routines`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Smart Routines | Your skincare routine, finally built around you" />
        <meta
          name="twitter:description"
          content="A living AM + PM skincare routine that adapts to your skin profile, the season, your budget and your existing products."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="container mx-auto px-4 pb-16 pt-24 md:pt-32 lg:pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-center">
              <Badge variant="outline" className="gap-2 rounded-full px-4 py-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by Advanced SKYNN AI
              </Badge>
            </div>

            <h1 className="font-heading text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Your skincare routine, finally built around you.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
              Smart Routines turns your Advanced SKYNN AI Skin Analysis into a living AM + PM routine that adapts to
              your skin profile, the season, your budget and the products already on your shelf.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild onClick={() => handleCTAClick("hero-primary")}>
                <Link to={primaryCTA.href} className="min-w-[200px]">
                  {primaryCTA.label}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                onClick={() => handleCTAClick("hero-secondary")}
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            {primaryCTA.description && (
              <p className="mt-4 text-center text-sm text-muted-foreground">{primaryCTA.description}</p>
            )}
          </div>

          {/* Hero Visual - Mock Routine Preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-4 md:grid-cols-2">
              {/* AM Routine */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sun className="h-5 w-5 text-amber-500" />
                      Morning Routine
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      4 steps
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Gentle Cleanser", time: "60s" },
                    { name: "Vitamin C Serum", time: "Wait 2min" },
                    { name: "Light Moisturiser", time: "30s" },
                    { name: "SPF 50+", time: "Final step" },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* PM Routine */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Moon className="h-5 w-5 text-indigo-500" />
                      Evening Routine
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      5 steps
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Oil Cleanser", time: "90s" },
                    { name: "Water-based Cleanser", time: "60s" },
                    { name: "Retinol 0.5%", time: "Wait 3min" },
                    { name: "Barrier Cream", time: "30s" },
                    { name: "Night Treatment", time: "Final step" },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Example routine — yours will be uniquely built around your skin analysis
            </p>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className="border-y border-border bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Your skin changes. Your routine should too.
            </h2>
            <div className="mt-12 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Conventional skincare routines assume your skin behaves the same way all year round. They assume the
                products that worked in winter will work in summer. They assume your budget doesn't matter, or that you
                need to buy everything from scratch.
              </p>
              <p>
                But your skin isn't static. It responds to seasons, stress, hormones, climate — and the products you
                already own might be exactly what it needs.
              </p>
              <p className="font-medium text-foreground">Smart Routines is the alternative.</p>
            </div>
          </div>
        </section>

        {/* What Makes Smart Routines Different */}
        <section id="features" className="py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                What makes Smart Routines different
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                A living skincare system, not another static routine generator
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: FlaskConical,
                  title: "Built around your skin",
                  description:
                    "Uses your Advanced SKYNN AI Skin Analysis and personal skin profile to create genuinely personalised recommendations.",
                },
                {
                  icon: Package,
                  title: "Uses what you already own",
                  description:
                    "Prioritises suitable products already on your shelf instead of automatically encouraging another shopping spree.",
                },
                {
                  icon: Calendar,
                  title: "Adapts to the season",
                  description:
                    "Your routine can respond to changing seasonal conditions and environmental needs throughout the year.",
                },
                {
                  icon: Wallet,
                  title: "Respects your budget",
                  description:
                    "Routine recommendations account for your selected budget so skincare stays sustainable for your life.",
                },
                {
                  icon: Layers,
                  title: "AM + PM, intelligently structured",
                  description:
                    "Organises products into practical morning and evening routines with proper timing and layering guidance.",
                },
                {
                  icon: RefreshCw,
                  title: "A routine that evolves",
                  description:
                    "Designed as a living system rather than a static one-time recommendation that sits in a PDF forever.",
                },
              ].map((feature, i) => (
                <Card key={i} className="border-2 transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* From Analysis to Routine - 3-Step Flow */}
        <section id="how-it-works" className="border-y border-border bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                From analysis to routine
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Three intelligent steps that turn your skin data into your daily routine
              </p>
            </div>

            <div className="relative space-y-12 lg:space-y-16">
              {/* Connecting line for desktop */}
              <div className="absolute left-8 top-16 hidden h-[calc(100%-8rem)] w-0.5 bg-border lg:block" />

              {[
                {
                  number: "01",
                  title: "Analyse",
                  subtitle: "SKYNN AI learns your skin",
                  description:
                    "Your Advanced Skin Analysis creates the deeper skin profile Smart Routines needs to build something genuinely personal.",
                  icon: FlaskConical,
                },
                {
                  number: "02",
                  title: "Personalise",
                  subtitle: "We build around your real life",
                  description:
                    "Smart Routines considers your skin, products, budget and seasonal context to create a routine that actually fits your circumstances.",
                  icon: Heart,
                },
                {
                  number: "03",
                  title: "Adapt",
                  subtitle: "Your routine keeps evolving",
                  description:
                    "Your AM + PM routine can adapt as your circumstances and skincare needs change, not locked into a single moment in time.",
                  icon: RefreshCw,
                },
              ].map((step, i) => (
                <div key={i} className="relative flex items-start gap-6 lg:gap-8">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-background">
                    <step.icon className="h-7 w-7 text-primary" />
                    <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-heading text-2xl font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm font-medium uppercase tracking-wide text-primary">{step.subtitle}</p>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Show the Experience - Product Showcase */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Not a routine. <span className="text-primary">Your</span> routine.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Smart Routines turns your skin analysis into something you can actually use every morning and every
                night.
              </p>
            </div>

            <Card className="overflow-hidden border-2">
              <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">Your Smart Routine</h3>
                      <p className="text-xs text-muted-foreground">Personalized • Seasonal • Budget-aware</p>
                    </div>
                  </div>
                  <Badge className="gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Active
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Morning
                      </h4>
                      <span className="text-xs text-muted-foreground">~5 min</span>
                    </div>
                    <div className="space-y-2">
                      {["Cleanser", "Serum", "Moisturiser", "SPF"].map((item, i) => (
                        <div key={i} className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <span className="font-medium text-foreground">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        Evening
                      </h4>
                      <span className="text-xs text-muted-foreground">~7 min</span>
                    </div>
                    <div className="space-y-2">
                      {["Double Cleanse", "Treatment", "Moisturiser", "Night Cream", "Eye Care"].map((item, i) => (
                        <div key={i} className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <span className="font-medium text-foreground">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Season</p>
                    <p className="text-sm font-semibold text-foreground">Summer</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-semibold text-foreground">Moderate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Your products</p>
                    <p className="text-sm font-semibold text-foreground">3 used</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Your Shelf Comes With You */}
        <section className="border-y border-border bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                You don't need to throw away your bathroom cabinet.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Smart Routines considers the products you already own and helps determine where suitable products fit
                into your routine.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-background p-8">
              <div className="grid gap-8 md:grid-cols-4 md:gap-4">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Your existing products</p>
                </div>

                <div className="flex items-center justify-center">
                  <ChevronRight className="h-6 w-6 rotate-90 text-muted-foreground md:rotate-0" />
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <FlaskConical className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Compatibility check</p>
                </div>

                <div className="flex items-center justify-center">
                  <ChevronRight className="h-6 w-6 rotate-90 text-muted-foreground md:rotate-0" />
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Your personalized routine</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Season + Budget Demonstration */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Your skin in January ≠ your skin in July.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                The same skin responds differently to different conditions — Smart Routines adapts.
              </p>
            </div>

            <div className="mb-6 flex justify-center gap-2">
              <Button
                variant={activeSeasonTab === "summer" ? "default" : "outline"}
                onClick={() => setActiveSeasonTab("summer")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Summer
              </Button>
              <Button
                variant={activeSeasonTab === "winter" ? "default" : "outline"}
                onClick={() => setActiveSeasonTab("winter")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Winter
              </Button>
            </div>

            <Card className="border-2">
              <CardContent className="p-6">
                {activeSeasonTab === "summer" ? (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <Sun className="h-6 w-6 text-amber-500" />
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">Summer Routine</h3>
                        <p className="text-sm text-muted-foreground">
                          Focus: UV protection, lighter hydration, oil control
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">AM</h4>
                        <ul className="space-y-2">
                          {["Gentle foaming cleanser", "Vitamin C serum", "Lightweight gel moisturiser", "SPF 50+"].map(
                            (item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">PM</h4>
                        <ul className="space-y-2">
                          {["Double cleanse", "Light exfoliant", "Hydrating serum", "Gel moisturiser"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <Moon className="h-6 w-6 text-indigo-500" />
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">Winter Routine</h3>
                        <p className="text-sm text-muted-foreground">
                          Focus: Barrier support, richer hydration, dryness prevention
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">AM</h4>
                        <ul className="space-y-2">
                          {["Cream cleanser", "Hydrating serum", "Rich moisturiser", "SPF 30+"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">PM</h4>
                        <ul className="space-y-2">
                          {["Oil cleanser", "Barrier repair serum", "Ceramide cream", "Occlusive treatment"].map(
                            (item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="font-heading text-xl font-bold text-foreground">Set your budget. We'll work within it.</p>
              <p className="mt-2 text-muted-foreground">
                Smart Routines creates recommendations that respect your financial reality.
              </p>
            </div>
          </div>
        </section>

        {/* Advanced Analysis Gate */}
        <section className="border-y border-border bg-primary/5 py-16 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-background">
                <FlaskConical className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Smart Routines starts with knowing your skin.
              </h2>
              <div className="mx-auto mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  Smart Routines is powered by the deeper skin profile created by SKYNN AI's{" "}
                  <span className="font-semibold text-foreground">Advanced Skin Analysis</span>.
                </p>
                <div className="rounded-xl border-2 border-border bg-background p-6">
                  <p className="font-medium text-foreground">
                    The free Starter Skin Analysis does not unlock Smart Routines.
                  </p>
                  <p className="mt-3 text-base">
                    Starter gives you an introduction to your skin. Advanced Analysis goes deeper, creating the
                    personalised foundation Smart Routines needs to build your dynamic AM + PM routine.
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Button size="lg" asChild onClick={() => handleCTAClick("gate-primary")}>
                  <Link to={primaryCTA.href} className="min-w-[240px]">
                    Get My Advanced Skin Analysis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Access Options */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Choose how you want to unlock it.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 transition-colors hover:border-primary">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">Analysis Pass</Badge>
                    <span className="text-sm text-muted-foreground">From R25</span>
                  </div>
                  <CardTitle className="text-xl">Once-off Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Get Advanced Skin Analysis as a once-off service using your Analysis Pass.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Available to Glow Explorer and Glow Lite members</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Single Advanced Analysis</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Unlocks Smart Routines</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild onClick={() => handleCTAClick("access-pass")}>
                    <Link to="/pricing">Get Analysis Pass</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">R99/mo</span>
                  </div>
                  <CardTitle className="text-xl">Glow Insider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Get Advanced Skin Analysis and unlock the wider Glow Insider experience.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Weekly live AI skin re-analysis</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Unlimited reviews & podcasts</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Smart Routines included</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild onClick={() => handleCTAClick("access-insider")}>
                    <Link to="/pricing">Become an Insider</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors hover:border-primary">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">VIP</Badge>
                    <span className="text-sm text-muted-foreground">R299/mo</span>
                  </div>
                  <CardTitle className="text-xl">Glow VIP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Advanced Skin Analysis is part of your Glow VIP membership.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Everything in Insider</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Intelligent Routine Builder</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline" asChild onClick={() => handleCTAClick("access-vip")}>
                    <Link to="/pricing">Explore VIP</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Starter vs Advanced Comparison */}
        <section className="border-y border-border bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Why Advanced?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Comparing the analysis that powers Smart Routines
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border-2 border-border bg-background">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Capability</th>
                    <th className="p-4 text-center text-sm font-semibold text-muted-foreground">Starter</th>
                    <th className="p-4 text-center text-sm font-semibold text-primary">Advanced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { feature: "Basic skin insights", starter: true, advanced: true },
                    { feature: "Deeper personalised profile", starter: false, advanced: true },
                    { feature: "Powers Smart Routines", starter: false, advanced: true },
                    { feature: "Dynamic AM + PM routine", starter: false, advanced: true },
                    { feature: "Seasonal adaptation", starter: false, advanced: true },
                    { feature: "Budget-aware recommendations", starter: false, advanced: true },
                    { feature: "Shelf product integration", starter: false, advanced: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-4 text-sm text-foreground">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.starter ? (
                          <Check className="mx-auto h-5 w-5 text-muted-foreground" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.advanced ? (
                          <Check className="mx-auto h-5 w-5 text-primary" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Starter Analysis provides an introduction to your skin. Advanced Analysis creates the foundation for
              personalised routines.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="what-is" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  What is Smart Routines?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Smart Routines is a living AM and PM skincare routine system built around your Advanced SKYNN AI Skin
                  Analysis. It creates personalised morning and evening routines that adapt to your skin profile,
                  seasonal conditions, budget and the products you already own.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="what-need" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  What do I need to use Smart Routines?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Smart Routines requires an Advanced Skin Analysis by SKYNN AI. This can be accessed through an
                  Analysis Pass (from R25), Glow Insider membership, or Glow VIP membership.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="starter-included" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Is Smart Routines included with the free Starter Skin Analysis?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. Smart Routines is powered by the Advanced Skin Analysis by SKYNN AI. The free Starter Skin
                  Analysis provides an introduction to your skin, but does not create the deeper personalised profile
                  needed to generate genuinely personalised routines.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cost" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  How much does Advanced Skin Analysis cost?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Glow Explorer and Glow Lite members can access Advanced Skin Analysis using an Analysis Pass, starting
                  from R25. It's also included with Glow Insider (R99/month) and Glow VIP (R299/month) memberships.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="membership-included" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Is Advanced Skin Analysis included with membership?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Advanced Skin Analysis is included with both Glow Insider and Glow VIP memberships. Glow Insider
                  members also get weekly live AI re-analysis, meaning your routine can stay current as your skin
                  changes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="own-products" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Can Smart Routines use products I already own?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Smart Routines considers products already on your shelf and helps determine where suitable
                  products fit into your routine. Not every product will automatically be recommended — it depends on
                  your skin profile and compatibility — but the system prioritises working with what you have before
                  suggesting new purchases.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="routine-change" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Does my routine change?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Smart Routines is designed as a living system that can adapt as your circumstances change. Your
                  routine may evolve based on seasonal conditions, changes to your shelf, budget adjustments, or updates
                  to your skin profile.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Can I set a budget?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Smart Routines allows you to set your skincare budget, and recommendations will work within your
                  financial constraints while still prioritising your skin needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="medical" className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  Is this medical advice?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. SKYNN AI and Smart Routines provide skincare information and personalised recommendations, not
                  medical diagnosis or treatment. If you have persistent, severe or concerning skin problems, please
                  consult a qualified healthcare professional or dermatologist.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-background">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Your skin is personal. Your routine should be too.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Start with Advanced Skin Analysis by SKYNN AI. Then let Smart Routines turn what it learns into a routine
              built around your real skin, your real shelf and your real life.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild onClick={() => handleCTAClick("final-primary")}>
                <Link to={primaryCTA.href} className="min-w-[200px]">
                  {primaryCTA.label}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                onClick={() => handleCTAClick("final-secondary")}
              >
                <Link to="/skynn-ai">Get Advanced Skin Analysis</Link>
              </Button>
            </div>
            {primaryCTA.description && (
              <p className="mt-6 text-sm text-muted-foreground">{primaryCTA.description}</p>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default SmartRoutines;
