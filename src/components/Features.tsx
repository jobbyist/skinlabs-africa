import { Sparkles, Newspaper, Star, Mic } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Routines",
    description: "A custom routine built around your skin and re-analysed as it changes — no spreadsheet required.",
  },
  {
    icon: Newspaper,
    title: "The Daily Skinny",
    description: "Global skincare science, translated for South African skin, climate and shelves — not just reposted.",
  },
  {
    icon: Star,
    title: "Independent Reviews",
    description: "We tell you what's actually in the bottle, not what the marketing wants you to believe. No affiliate deals, no gifted samples.",
  },
  {
    icon: Mic,
    title: "The Skin Deep Podcast",
    description: "Dermatologist interviews and ingredient deep-dives that don't take themselves too seriously. New episode weekly.",
  },
];

const Features = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            The short version
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Skincare intelligence, built for South African skin
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card p-6 rounded-2xl border border-border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
