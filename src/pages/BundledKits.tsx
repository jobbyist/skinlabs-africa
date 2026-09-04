import { Helmet } from "react-helmet-async";
import { Package, Sparkles, Layers, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const BundledKits = () => {
  const kits = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      name: "The Essentials Kit",
      description: "A complete daily routine — cleanse, treat, moisturise — in one system.",
      price: "R 1,499",
      includes: ["Gentle Cleanser", "Hyaluronic Serum", "Daily Moisturizer", "Routine Guide"],
    },
    {
      icon: <Layers className="h-8 w-8" />,
      name: "The Glow Kit",
      description: "A brightening system to even tone and restore radiance over 8 weeks.",
      price: "R 1,899",
      includes: ["Vitamin C Serum", "Brightening Mask", "Glow Moisturizer", "Application Protocol"],
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      name: "The Age-Defence Kit",
      description: "Peptide + retinol multi-step system for firmness and long-term prevention.",
      price: "R 2,299",
      includes: ["Retinol Serum", "Peptide Cream", "Eye Treatment", "Ramp-Up Schedule"],
    },
    {
      icon: <Package className="h-8 w-8" />,
      name: "The Discovery Kit",
      description: "Try our bestsellers in travel sizes — perfect for testing a full routine.",
      price: "R 799",
      includes: ["5 Travel Sizes", "Skincare Guide", "Sample Voucher", "Refill Discount"],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Bundled Kits — Curated Skincare Systems | SKINLABS</title>
        <meta name="description" content="Multi-product SkinLabs kits built to layer without conflict, with rand pricing and what's actually in each box." />
        <link rel="canonical" href="https://skinlabs.co.za/bundled-kits" />
        <meta property="og:title" content="Bundled Kits | SKINLABS" />
        <meta property="og:description" content="Curated skincare kits formulated to work together, with rand pricing." />
        <meta property="og:url" content="https://skinlabs.co.za/bundled-kits" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Bundled Kits</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Multi-product SkinLabs systems built to work together — no guessing which serum fights which moisturiser.
                  </p>
                </div>

                <div className="my-8">
                  <AdSlot placement="bundled-kits-mid" compact />
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {kits.map((kit) => (
                    <div key={kit.name} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">{kit.icon}</div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">{kit.name}</h2>
                      <p className="text-muted-foreground mb-4">{kit.description}</p>
                      <div className="text-3xl font-bold text-primary mb-4">{kit.price}</div>
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-foreground mb-2">Kit Includes:</div>
                        <ul className="space-y-2">
                          {kit.includes.map((item) => (
                            <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full">Add to Cart</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Why buy a kit instead of piecing it together?</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary"><Layers className="h-6 w-6" /></div>
                      <h3 className="font-semibold text-foreground mb-2">Formulated to Stack</h3>
                      <p className="text-sm text-muted-foreground">Every product in a kit is designed to layer without conflict.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary"><ShieldCheck className="h-6 w-6" /></div>
                      <h3 className="font-semibold text-foreground mb-2">Value Pricing</h3>
                      <p className="text-sm text-muted-foreground">Save up to 25% versus buying products individually.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary"><Sparkles className="h-6 w-6" /></div>
                      <h3 className="font-semibold text-foreground mb-2">Routine-Ready</h3>
                      <p className="text-sm text-muted-foreground">Each kit ships with a routine protocol and a check-in schedule.</p>
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

export default BundledKits;
