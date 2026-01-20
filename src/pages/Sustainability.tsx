import { Helmet } from "react-helmet-async";
import { Leaf, Recycle, Heart, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Sustainability = () => {
  const initiatives = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Clean Ingredients",
      description: "All products are free from harmful chemicals and made with sustainably sourced ingredients",
      stats: "100% Clean"
    },
    {
      icon: <Recycle className="h-8 w-8" />,
      title: "Recyclable Packaging",
      description: "Our packaging is fully recyclable and made from post-consumer recycled materials",
      stats: "85% Recycled"
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Minimal Waste",
      description: "We minimize packaging waste and offer refill options for many products",
      stats: "40% Less Waste"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Cruelty-Free",
      description: "Never tested on animals and certified cruelty-free by leading organizations",
      stats: "Certified"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Sustainability - Our Environmental Commitment | SKINLABS</title>
        <meta
          name="description"
          content="Learn about SkinLabs' commitment to sustainability through clean ingredients, recyclable packaging, and cruelty-free practices."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Leaf className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Sustainability
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Building a better future for your skin and our planet
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Commitment</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      At SkinLabs, we believe that beautiful skin shouldn't come at the expense of our planet. That's why sustainability is at the core of everything we do - from ingredient sourcing to packaging design.
                    </p>
                    <p>
                      We're committed to reducing our environmental impact while delivering the high-quality products you deserve. Every decision we make considers both efficacy and environmental responsibility.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {initiatives.map((initiative, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        {initiative.icon}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-foreground">
                          {initiative.title}
                        </h3>
                        <span className="text-primary font-bold text-sm">{initiative.stats}</span>
                      </div>
                      <p className="text-muted-foreground">{initiative.description}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Our Goals for 2025</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Carbon Neutral Operations</h3>
                        <p className="text-sm text-muted-foreground">
                          Achieve carbon neutrality across all operations and supply chain
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">100% Recyclable Packaging</h3>
                        <p className="text-sm text-muted-foreground">
                          Transition all packaging to fully recyclable or compostable materials
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Plastic-Free Shipping</h3>
                        <p className="text-sm text-muted-foreground">
                          Eliminate all plastic from shipping materials and use biodegradable alternatives
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Water Conservation</h3>
                        <p className="text-sm text-muted-foreground">
                          Reduce water usage in manufacturing by 50% through innovative processes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Join Us in Making a Difference
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Every purchase supports our mission to create beautiful products while protecting our planet
                  </p>
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

export default Sustainability;
