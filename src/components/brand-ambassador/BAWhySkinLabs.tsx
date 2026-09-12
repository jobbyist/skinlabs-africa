import { Compass, Heart, TrendingUp, Users } from "lucide-react";

const pillars = [
  { icon: Compass, title: "Create", description: "Content people want to watch." },
  { icon: Users, title: "Connect", description: "Introduce your community to SkinLabs®." },
  { icon: TrendingUp, title: "Earn", description: "Build recurring referral value." },
  { icon: Heart, title: "Grow", description: "Create opportunities for deeper collaboration." },
];

const BAWhySkinLabs = () => {
  return (
    <section className="border-b border-border bg-secondary/40 py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Why SkinLabs®?</p>
            <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Help build the future of skincare discovery.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              SkinLabs® is building a digital skincare ecosystem designed to help people discover better information,
              better products and better ways to understand their skin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <pillar.icon className="h-4 w-4 text-foreground" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-foreground">{pillar.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BAWhySkinLabs;
