import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Package, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { allSeasons, seasonHubs } from "@/data/seasonals";

const CURRENT_SEASON = "spring" as const;

const threeCards = [
  {
    title: "The Spring Reset",
    description: "A practical routine guide for the transition into spring.",
    href: "/seasonals/spring",
    icon: Sparkles,
  },
  {
    title: "What Your Skin Needs",
    description: "Current guides and advice for the season you're actually living in.",
    href: "/seasonals/spring#the-edit",
    icon: BookOpen,
  },
  {
    title: "Products Worth Knowing",
    description: "Curated picks linked directly to SkinLabs reviews — no invented claims.",
    href: "/reviews",
    icon: Package,
  },
];

const Seasonals = () => {
  const canonical = "https://skinlabs.co.za/seasonals";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Seasonals by SkinLabs",
        description: "Skincare for the season you're actually living in — curated South African seasonal skincare guides.",
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Seasonals", item: canonical }],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Seasonals by SkinLabs — SA Seasonal Skincare Guides"
        description="Skincare for the season you're actually living in. Seasonal routines, product picks and climate-specific guides for South African skin."
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-24 pb-24">
        <section className="container mx-auto px-4 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Seasonals</p>
          <h1 className="mx-auto max-w-2xl font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Your skin changes with the seasons. So should your routine.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Discover the latest SkinLabs product picks, skincare guides and seasonal advice for South Africans —
            skincare for the season you're actually living in, not whatever's trending this week.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link to={`/seasonals/${CURRENT_SEASON}`}>
              Explore the season <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>

        <section className="container mx-auto mt-14 px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {threeCards.map((card) => (
              <Link
                key={card.title}
                to={card.href}
                className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <card.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-heading text-lg font-bold text-foreground">{card.title}</h2>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto mt-16 px-4">
          <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">The four seasonal hubs</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {allSeasons.map((season) => {
              const hub = seasonHubs[season];
              const isCurrent = season === CURRENT_SEASON;
              return (
                <Link
                  key={season}
                  to={`/seasonals/${season}`}
                  className={`group flex flex-col overflow-hidden rounded-3xl border bg-card transition-colors hover:border-primary ${isCurrent ? "border-primary" : "border-border"}`}
                >
                  <div className="relative">
                    <img src={hub.heroImage.url} alt={hub.heroImage.alt} loading="lazy" className="h-32 w-full object-cover" />
                    {isCurrent && (
                      <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        Current season
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{hub.months}</p>
                    <h3 className="mt-1 font-heading text-base font-bold text-foreground">{hub.h1}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{hub.tagline}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Seasonals;
