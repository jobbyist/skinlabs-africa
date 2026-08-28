import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, Send, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productReviews, overallScore } from "@/data/reviews";
import { getSeasonHub, allSeasons, type Season } from "@/data/seasonals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SeasonalHub = () => {
  const { season: seasonParam } = useParams();
  const season = (seasonParam ?? "spring") as Season;
  const hub = allSeasons.includes(season) ? getSeasonHub(season) : undefined;

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  if (!hub) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Season not found</h1>
          <p className="mt-2 text-muted-foreground">Try Spring, Summer, Autumn or Winter.</p>
          <Button asChild className="mt-6">
            <Link to="/seasonals">Back to Seasonals</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const canonical = `https://skinlabs.co.za/seasonals/${hub.season}`;

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setSubscribing(false);
    if (error) {
      if (error.code === "23505") toast.info("You're already on the list!");
      else toast.error("Something went wrong. Please try again.");
      return;
    }
    setEmail("");
    toast.success("You're in — we'll send the next Seasonals Edit straight to your inbox.");
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: hub.h1,
        description: hub.seoDescription,
        image: { "@type": "ImageObject", url: hub.heroImage.url },
        author: { "@type": "Organization", name: "SkinLabs", url: "https://skinlabs.co.za" },
        publisher: {
          "@type": "Organization",
          name: "SkinLabs",
          logo: { "@type": "ImageObject", url: "https://skinlabs.co.za/pwa-512.png" },
        },
        datePublished: hub.publishDate,
        dateModified: hub.modifiedDate,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Seasonals", item: "https://skinlabs.co.za/seasonals" },
          { "@type": "ListItem", position: 2, name: hub.h1, item: canonical },
        ],
      },
      {
        "@type": "ItemList",
        name: hub.productEdit.heading,
        itemListElement: hub.productEdit.picks.map((pick, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: pick.role,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title={hub.seoTitle} description={hub.seoDescription} canonical={canonical} ogType="article" ogImage={hub.heroImage.url} jsonLd={jsonLd} />
      <Header />
      <main className="pb-24">
        {/* Hero */}
        <section className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 -z-10">
            <img src={hub.heroImage.url} alt={hub.heroImage.alt} className="h-full w-full object-cover opacity-20" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />
          </div>
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">{hub.eyebrow}</p>
            <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl">{hub.h1}</h1>
            <p className="mt-3 text-lg font-medium text-foreground/80">{hub.tagline}</p>
            <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">{hub.heroIntro}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <a href="#the-edit">
                  <Sparkles className="h-4 w-4" /> Explore the {hub.h1.replace("The ", "")} Edit
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="#routine">
                  Read the routine <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{hub.months}</p>
          </div>
        </section>

        <div className="container mx-auto max-w-4xl px-4">
          <figure className="mt-2">
            <img src={hub.heroImage.url} alt={hub.heroImage.alt} className="w-full rounded-3xl object-cover" loading="lazy" style={{ maxHeight: 420 }} />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              Photo by{" "}
              <a href={hub.heroImage.creditUrl} target="_blank" rel="noreferrer noopener" className="underline">
                {hub.heroImage.creditName}
              </a>{" "}
              on Unsplash
            </figcaption>
          </figure>

          {/* Quick answer */}
          <section className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground">{hub.quickAnswer.heading}</h2>
            <ul className="mt-4 space-y-2">
              {hub.quickAnswer.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{hub.quickAnswer.note}</p>
          </section>

          {/* Priorities */}
          <section className="mt-12">
            <h2 className="mb-5 font-heading text-xl font-bold text-foreground">{hub.h1.includes("Reset") ? `${hub.season[0].toUpperCase()}${hub.season.slice(1)} skin priorities` : "Skin priorities this season"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {hub.priorityCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-heading text-base font-bold text-foreground">{card.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The Edit */}
          <section id="the-edit" className="mt-12 scroll-mt-24">
            <h2 className="mb-5 font-heading text-xl font-bold text-foreground">{hub.productEdit.heading}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {hub.productEdit.picks.map((pick) => {
                const product = productReviews.find((review) => review.id === pick.reviewId);
                if (!product) return null;
                return (
                  <div key={pick.reviewId} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{pick.role}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                    <h3 className="font-heading text-base font-bold text-foreground">{product.product_name}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{pick.whyWePickedIt}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">SkinLabs score: {overallScore(product)}/10</span>
                      <Link to={`/reviews/${product.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                        Read the review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Routine */}
          <section id="routine" className="mt-12 scroll-mt-24">
            <h2 className="mb-5 font-heading text-xl font-bold text-foreground">A simple {hub.season} routine</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Morning</p>
                <ol className="mt-3 space-y-2">
                  {hub.routine.am.map((step, index) => (
                    <li key={step} className="flex gap-2 text-sm text-foreground">
                      <span className="font-heading font-bold text-primary">{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Evening</p>
                <ol className="mt-3 space-y-2">
                  {hub.routine.pm.map((step, index) => (
                    <li key={step} className="flex gap-2 text-sm text-foreground">
                      <span className="font-heading font-bold text-primary">{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{hub.routine.note}</p>
          </section>

          {/* Regional context */}
          {hub.regionalModules.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-2 font-heading text-xl font-bold text-foreground">
                {hub.season[0].toUpperCase() + hub.season.slice(1)} does not feel the same everywhere
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">South Africa isn't one climate — here's how it changes by region.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {hub.regionalModules.map((module) => (
                  <div key={module.region} className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="flex items-center gap-1.5 font-heading text-base font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> {module.region}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{module.climateContext}</p>
                    <p className="mt-2 text-sm text-foreground">{module.routineNote}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Guides and reviews */}
          <section className="mt-12">
            <h2 className="mb-5 font-heading text-xl font-bold text-foreground">Guides and reviews worth reading</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {hub.guidesAndReviews.map((link) => (
                <Link key={link.href} to={link.href} className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary">
                  <span className="text-sm font-semibold text-foreground">{link.label}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{link.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Read more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Worth knowing */}
          <div className="mt-12 rounded-3xl border border-primary/30 bg-primary/5 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{hub.worthKnowing.label}</p>
            <p className="mt-2 text-base text-foreground">{hub.worthKnowing.text}</p>
          </div>

          {/* Editorial standards */}
          <p className="mt-8 text-xs text-muted-foreground">{hub.editorialStandards}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Published {new Date(hub.publishDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · Last updated{" "}
            {new Date(hub.modifiedDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Newsletter */}
          <section className="mt-12 rounded-3xl border border-border bg-card p-6 text-center md:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground">Get the next Seasonals Edit</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Useful skincare advice for the season you're actually living in — straight to your inbox, no spam.
            </p>
            <form onSubmit={handleSubscribe} className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
              <Input type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="flex-1" />
              <Button type="submit" disabled={subscribing} className="gap-2">
                {subscribing ? "Subscribing…" : "Subscribe"} <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">We'll never share your email. Unsubscribe anytime.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SeasonalHub;
