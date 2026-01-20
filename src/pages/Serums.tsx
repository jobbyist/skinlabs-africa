import { Helmet } from "react-helmet-async";
import { Droplet, Sparkles, Shield, Sun } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Serums = () => {
  const serums = [
    {
      icon: <Sun className="h-8 w-8" />,
      name: "Vitamin C Brightening Serum",
      description: "15% L-Ascorbic Acid for radiant, even-toned skin",
      price: "R 599",
      benefits: ["Brightens skin", "Fades dark spots", "Boosts collagen"]
    },
    {
      icon: <Droplet className="h-8 w-8" />,
      name: "Hyaluronic Acid Hydration",
      description: "Multi-weight hyaluronic acid for deep hydration",
      price: "R 499",
      benefits: ["Intense hydration", "Plumps skin", "Reduces fine lines"]
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      name: "Retinol Anti-Aging Treatment",
      description: "0.5% Retinol for smoothing and renewal",
      price: "R 699",
      benefits: ["Reduces wrinkles", "Improves texture", "Cell renewal"]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      name: "Niacinamide B3 Serum",
      description: "10% Niacinamide for pore refinement and barrier repair",
      price: "R 549",
      benefits: ["Minimizes pores", "Controls oil", "Strengthens barrier"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Serums - Targeted Treatments | SKINLABS</title>
        <meta
          name="description"
          content="Shop powerful serums including Vitamin C, Hyaluronic Acid, Retinol, and Niacinamide. Science-backed formulas for visible results."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Targeted Serums
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Concentrated formulas with proven active ingredients for visible results
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {serums.map((serum, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {serum.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {serum.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {serum.description}
                      </p>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {serum.price}
                      </div>
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-foreground mb-2">Key Benefits:</div>
                        <ul className="space-y-2">
                          {serum.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full">Add to Cart</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      Why Our Serums?
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Every formula is developed with dermatologists and contains clinical-strength actives at optimal concentrations
                    </p>
                  </div>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">Clinical</div>
                      <div className="text-sm text-muted-foreground">Grade Formulas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">Cruelty</div>
                      <div className="text-sm text-muted-foreground">Free</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">No</div>
                      <div className="text-sm text-muted-foreground">Harmful Ingredients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">Dermatologist</div>
                      <div className="text-sm text-muted-foreground">Tested</div>
                    </div>
                  </div>
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

export default Serums;
