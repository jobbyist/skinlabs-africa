import { Link2, Megaphone, Video } from "lucide-react";

const pillars = [
  {
    icon: Megaphone,
    title: "Ambassador",
    description: "Represent SkinLabs® authentically.",
  },
  {
    icon: Link2,
    title: "Affiliate",
    description: "Generate referrals and earn recurring commission.",
  },
  {
    icon: Video,
    title: "Creator",
    description: "Produce engaging TikTok and Instagram content for your audience.",
  },
];

const BAProgrammeOverview = () => {
  return (
    <section id="programme" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">The Programme</p>
            <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Not just a post. A creator partnership.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              SkinLabs® is building a creator network around skincare discovery, education, community and digital
              experiences.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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

export default BAProgrammeOverview;
