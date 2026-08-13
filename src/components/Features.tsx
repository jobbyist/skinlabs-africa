import { Sparkles, Newspaper, Star, Mic } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Free AI Routine Assessment",
    description: "Complete the full 20-question skin assessment and get a personalized AM/PM routine — free, no account required to try it.",
  },
  {
    icon: Newspaper,
    title: "The Daily Skinny",
    description: "Daily briefings of global skincare science translated for South African skin, climate and shelves. One full briefing free every day.",
  },
  {
    icon: Star,
    title: "Independent Reviews",
    description: "Honest, unbiased reviews of SA skincare products with no affiliate deals or gifted samples — scores and pricing always free to browse.",
  },
  {
    icon: Mic,
    title: "Free Weekly Podcast",
    description: "The Skin Deep Podcast: new episodes every Wednesday, free to stream, with show notes and timestamps.",
  },
];

const Features = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Free to Start
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Real Skincare Intelligence, No Paywall Upfront
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
