import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  Heart, Users, Award, Target, Newspaper, Mic, Sparkles, Star, BookOpen,
  Microscope, Beaker, Brain, Leaf, Recycle, Package, Check, Crown, Sun, ShoppingBag,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { membershipPlans } from "@/data/plans";
import { linkifyMoneyBackGuarantee } from "@/lib/moneyBackLink";
import { cn } from "@/lib/utils";

const About = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const timeout = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timeout);
  }, [location.hash]);

  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Independent",
      description: "No affiliate deals, no gifted samples — our reviews and briefings answer to readers only"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Evidence-Led",
      description: "Every briefing and routine is grounded in published dermatology research"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Built for SA Skin",
      description: "Written for local climate, water, shelves and melanin-rich skin — not imported advice"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "AI Where It Helps",
      description: "AI translates research into a routine you can actually follow, reviewed against clinical guidance"
    }
  ];

  const keyFeatures = [
    {
      icon: <Newspaper className="h-6 w-6" />,
      title: "The Daily Skinny",
      description: "Daily briefings of global skincare science translated for SA skin, climate and shelves.",
      highlight: "Available as premium PDF magazine",
      link: "/newsroom"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Independent Product Reviews",
      description: "We tell you what's actually in the bottle, not what the marketing wants you to believe. No affiliate deals, no gifted samples.",
      highlight: "Scored for local conditions",
      link: "/reviews"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Spotlight by SkinLabs",
      description: "A monthly, review-led ranking of South African skincare brands, computed from our own published scores.",
      highlight: "New",
      link: "/spotlight"
    },
    {
      icon: <Sun className="h-6 w-6" />,
      title: "Seasonal Guides",
      description: "Skincare advice built around the season you're actually living in, with regional notes for every SA climate zone.",
      highlight: "New",
      link: "/seasonals"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Formulator",
      description: "Personalized skincare routines, progress trackers, and dermatologist-approved recommendations.",
      highlight: "Premium member feature",
      link: "/ai-formulator"
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "The Skin Deep Podcast",
      description: "Expert interviews, skincare deep-dives and myth-busting conversations.",
      highlight: "New episodes weekly",
      link: "/podcast"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Consult",
      description: "One-on-one skincare consultations with independent HPCSA-registered practitioners.",
      highlight: "Personalized guidance",
      link: "/consultations"
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Marketplace by Openhaus",
      description: "SkinLabs' upcoming multivendor marketplace for South African skincare brands.",
      highlight: "Coming soon",
      link: "/shop"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community-First",
      description: "Join 3.7K+ members in our growing skincare community.",
      highlight: "Member-funded platform",
      link: "/pricing"
    }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Platform Launch",
      description: "SkinLabs launched as an AI-powered e-commerce platform for personalized skincare."
    },
    {
      year: "2024",
      title: "Content Expansion",
      description: "Introduced The Daily Skinny briefings and independent product reviews for the SA market."
    },
    {
      year: "Early 2024",
      title: "Podcast Launch",
      description: "Launched The Skin Deep Podcast featuring expert interviews and skincare education."
    },
    {
      year: "Mid 2024",
      title: "Community Growth",
      description: "Reached 3.7K+ community members and introduced membership tiers."
    },
    {
      year: "Late 2024",
      title: "Strategic Pivot",
      description: "Evolved from e-commerce to a content and community-first platform, focusing on independent journalism."
    },
    {
      year: "2025",
      title: "Enhanced AI Features",
      description: "Upgraded AI Formulator to premium service with personalized routines, trackers and product recommendations."
    },
    {
      year: "2026",
      title: "Spotlight & Seasonal Guides",
      description: "Launched Spotlight by SkinLabs (a review-led brand ranking) and Seasonal Guides for SA's four climate seasons."
    },
    {
      year: "2026",
      title: "Marketplace, Coming Soon",
      description: "Announced Marketplace by Openhaus — a multivendor marketplace for South African skincare brands, currently taking waitlist sign-ups."
    }
  ];

  const sciencePillars = [
    {
      icon: <Microscope className="h-8 w-8" />,
      title: "Research-Driven",
      description: "Every briefing and score is backed by peer-reviewed dermatological research and clinical studies"
    },
    {
      icon: <Beaker className="h-8 w-8" />,
      title: "Transparent Scoring",
      description: "Products are scored on efficacy, value, texture and SA climate fit using disclosed ingredient concentrations"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Technology",
      description: "Our AI Formulator analyses thousands of skin profiles to recommend the optimal routine and actives"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Editorial Standards",
      description: "Every claim a brand can't substantiate is flagged, capped, or disclosed — not quietly repeated"
    }
  ];

  const sustainabilityInitiatives = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Editorial Independence",
      description: "No affiliate deals or gifted samples influence a score — our members fund the work, not brands",
      stats: "100% Independent"
    },
    {
      icon: <Recycle className="h-8 w-8" />,
      title: "Locally Sourced Guidance",
      description: "We prioritise recommending SA-formulated and recyclable-packaged products where the evidence supports it",
      stats: "SA-First"
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Digital-First Platform",
      description: "A content and community platform with no physical shipping footprint — briefings, not boxes",
      stats: "Zero Shipping"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Responsible Recommendations",
      description: "We flag mineral-oil, fragrance and sustainability trade-offs honestly, even in well-loved products",
      stats: "Disclosed"
    }
  ];

  return (
    <>
      <Helmet>
        <title>About SkinLabs — Independent SA Skincare Platform | SKINLABS</title>
        <meta name="description" content="SkinLabs is an independent skin science platform: daily briefings, honest product reviews and our scoring methodology, built for South African skin." />
        <meta name="keywords" content="about SkinLabs, skincare platform South Africa, independent skincare reviews, AI skincare, skincare science SA, sustainability, our science" />
        <link rel="canonical" href="https://skinlabs.co.za/about" />
        <meta property="og:title" content="About SkinLabs — Independent SA Skincare Platform" />
        <meta property="og:description" content="Independent skin science platform with daily briefings, honest product reviews, our science, sustainability commitments and AI routines for South African skin." />
        <meta property="og:url" content="https://skinlabs.co.za/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About SkinLabs",
          "url": "https://skinlabs.co.za/about",
          "description": "Independent skin science platform built for South Africa with daily briefings, product reviews, our research methodology, sustainability commitments, AI routines, and membership plans.",
          "mainEntity": {
            "@type": "Organization",
            "name": "SkinLabs",
            "url": "https://skinlabs.co.za",
            "foundingDate": "2023",
            "description": "Content and community-first skincare platform for South Africa"
          }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    About SkinLabs
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    An independent skin science platform built for South Africa
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      SkinLabs started because skincare advice reaching South Africans was written for
                      other climates, other shelves and often other skin. We rebuilt it locally: a daily
                      editorial brief, independent product reviews scored against SA conditions, a podcast
                      and an AI formulator that turns dermatology research into a routine you can follow.
                    </p>
                    <p>
                      We are content-first rather than a storefront. That means no affiliate deals, no
                      gifted samples and no pressure to sell you a product — our members fund the work,
                      so the work answers to them.
                    </p>
                    <p>
                      Every briefing is summarised from credible global sources and then translated into
                      what it means here: high year-round UV, Highveld dryness, coastal humidity, hard
                      municipal water, local pricing and the realities of melanin-rich skin.
                    </p>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Journey</h2>
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-10">
                    <div className="space-y-6">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex gap-4 relative">
                          {index !== timeline.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                          )}
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary border-2 border-primary/20 relative z-10">
                            {item.year.slice(-2)}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {item.year}
                              </span>
                              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Platform Features</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {keyFeatures.map((feature, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {feature.highlight}
                              </span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={feature.link}>Explore →</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Values</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {values.map((value, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {value.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Our Science (merged from /our-science) */}
                <div id="science" className="mb-12 scroll-mt-24">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Microscope className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Our Science</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Where dermatological research meets transparent, disclosed editorial scoring
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Our Approach</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Every product review is scored out of 10 on four axes — Efficacy, Value, Texture and
                        SA Climate Match — derived from disclosed active concentrations, published
                        dermatological evidence, and SA retail pricing, not from independent lab or clinical
                        testing. Where a brand's claim outpaces what its formula can support, we cap the
                        score and say so.
                      </p>
                      <p>
                        Our AI Formulator applies the same evidence-first standard: it translates dermatology
                        research into a routine matched to your skin type, climate zone and budget, reviewed
                        against clinical guidance rather than trend cycles.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {sciencePillars.map((pillar, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {pillar.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{pillar.title}</h3>
                        <p className="text-muted-foreground">{pillar.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-10">
                    <h3 className="text-xl font-bold text-foreground mb-6">Our Scoring Process</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">1. Ingredient &amp; Evidence Review</h4>
                        <p className="text-sm text-muted-foreground">
                          We compare disclosed active concentrations against published dermatology and
                          cosmetic-chemistry evidence for those actives at those levels.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">2. Value Benchmarking</h4>
                        <p className="text-sm text-muted-foreground">
                          Price-per-ml is benchmarked against comparable SA products from brand sites and
                          major local stockists, captured at the research date.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">3. SA Climate Reasoning</h4>
                        <p className="text-sm text-muted-foreground">
                          Formulation science is reasoned across the dry Highveld, humid KZN coast and windy
                          Western Cape belt — not climate-chamber testing.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">4. Editorial Disclosure</h4>
                        <p className="text-sm text-muted-foreground">
                          Every product page carries our methodology and a consumer-protection disclaimer:
                          scores are editorial opinions, not claims of independent lab or clinical testing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sustainability (merged from /sustainability) */}
                <div id="sustainability" className="mb-12 scroll-mt-24">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Leaf className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Sustainability</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Building a more honest, lower-footprint way to give skincare advice
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Our Commitment</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        As a content and community-first platform, our biggest sustainability lever is
                        editorial honesty: we never let affiliate deals or gifted samples influence a
                        score, and we flag mineral-oil bases, synthetic fragrance and packaging trade-offs
                        even in well-loved products.
                      </p>
                      <p>
                        We also carry a lighter footprint by design — SkinLabs is a digital briefing,
                        review and consultation platform with no warehousing or shipping operations, and we
                        prioritise recommending SA-formulated, recyclable-packaged products where the
                        evidence supports it.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {sustainabilityInitiatives.map((initiative, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-8">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {initiative.icon}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-semibold text-foreground">{initiative.title}</h3>
                          <span className="text-primary font-bold text-sm">{initiative.stats}</span>
                        </div>
                        <p className="text-muted-foreground">{initiative.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership upsell */}
                <div id="membership" className="mb-12 scroll-mt-24">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Become a Member</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      SkinLabs is funded by members, not brands — that independence is what keeps every
                      score honest. Choose the tier that matches how deep you want to go.
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    {membershipPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={cn(
                          "relative flex flex-col rounded-3xl border bg-card p-8",
                          plan.highlight ? "border-primary shadow-lg lg:-mt-4 lg:mb-4" : "border-border",
                        )}
                      >
                        {plan.highlight && (
                          <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            <Sparkles className="h-3 w-3" /> Most popular
                          </span>
                        )}
                        <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                        <div className="mt-6 flex items-end gap-1">
                          <span className="font-heading text-4xl font-extrabold text-foreground">R{plan.priceMonthly}</span>
                          <span className="pb-1 text-sm text-muted-foreground">/month</span>
                        </div>
                        <ul className="mt-6 flex-1 space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              {linkifyMoneyBackGuarantee(feature)}
                            </li>
                          ))}
                        </ul>
                        <Button className="mt-8 w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                          <a href="/pricing">{plan.cta}</a>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <p className="mt-8 text-center">
                    <Button variant="link" asChild>
                      <a href="/pricing">Compare all plan details →</a>
                    </Button>
                  </p>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Join the community
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Become a member for unlimited daily briefings, full product reviews and your
                    complete AI skincare routine.
                  </p>
                  <Button size="lg" asChild>
                    <a href="/pricing">Get started free</a>
                  </Button>
                </div>

              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
