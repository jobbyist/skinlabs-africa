import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Package, Sparkles } from "lucide-react";
import { seasonHubs } from "@/data/seasonals";

const spring = seasonHubs.spring;

const cards = [
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

const SeasonalsTeaser = () => {
  return (
    <section id="seasonals" className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Seasonals</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Your skin changes with the seasons. So should your routine.
            </h2>
            <p className="text-muted-foreground">{spring.heroIntro}</p>
          </div>
          <Link to="/seasonals" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            Explore the season
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <card.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{card.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeasonalsTeaser;
