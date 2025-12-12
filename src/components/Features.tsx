import { Sparkles, Leaf, Shield, Truck } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Formulations",
    description: "Personalized skincare routines created by advanced AI analysis of your unique skin profile.",
  },
  {
    icon: Leaf,
    title: "Clean Ingredients",
    description: "All products feature clinically-tested, cruelty-free ingredients backed by science.",
  },
  {
    icon: Shield,
    title: "Dermatologist Approved",
    description: "Every product and device is reviewed and approved by board-certified dermatologists.",
  },
  {
    icon: Truck,
    title: "Free Global Shipping",
    description: "Enjoy complimentary worldwide shipping on all orders over $100.",
  },
];

const Features = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Why Choose Us
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Science Meets Beauty
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
              <h3 className="font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
