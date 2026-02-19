import { Helmet } from "react-helmet-async";
import { Check, Clock, Package, Shield, Users, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";

const EdiblePouches = () => {
  const { formatPrice } = useCurrency();
  const preOrderPrice = 299;

  const benefits = [
    "Exclusive discounted price of R299 (save 40% off retail price)",
    "Bundled pack featuring all variants of Edible Skincare Pouches",
    "Early access to this revolutionary product before retail launch",
    "Backer's Guide via email/WhatsApp with real-time updates",
    "Access to online Product Roadmap Tracking Tool",
    "Dashboard access to track your package progress",
    "Support innovative South African skincare development",
  ];

  const timeline = [
    {
      phase: "Current Phase",
      title: "Production & Regulatory Compliance",
      description: "Finalizing formulations and obtaining necessary approvals",
    },
    {
      phase: "Next Phase",
      title: "Manufacturing",
      description: "Large-scale production of all variants",
    },
    {
      phase: "Final Phase",
      title: "Fulfillment & Delivery",
      description: "Package preparation and delivery to backers",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Edible Skincare Pouches - Pre-Order Campaign | SKINLABS</title>
        <meta
          name="description"
          content="Join our crowdfunding campaign to bring revolutionary Edible Skincare Pouches to market. Pre-order now for R299 and get exclusive early access."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">Limited to 250 Backers</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">
                  Edible Skincare Pouches
                  <span className="block text-primary mt-2">Pre-Order Campaign</span>
                </h1>

                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Be part of bringing the first-ever edible skincare pouches in Africa to market. 
                  Support innovation and get exclusive early access to this revolutionary product.
                </p>

                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="text-5xl font-bold text-foreground">{formatPrice(preOrderPrice)}</span>
                  <div className="text-left">
                    <span className="text-sm text-muted-foreground block">one-time payment</span>
                    <span className="text-sm text-muted-foreground line-through">R499</span>
                  </div>
                </div>

                <Button size="lg" className="gap-2 text-lg h-14 px-8">
                  <Package className="h-5 w-5" />
                  Pre-Order Now
                </Button>

                <p className="text-sm text-muted-foreground mt-4">
                  Campaign ends when we reach 250 backers or by June 30, 2026
                </p>
              </div>
            </div>
          </section>

          {/* What You Get Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4 text-center">
                  What's Included in Your Bundle
                </h2>
                <p className="text-lg text-muted-foreground mb-12 text-center">
                  Complete collection of all Edible Skincare Pouch variants at an exclusive discount
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-card border border-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🍬</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Bubblegum Pop</h3>
                    <p className="text-sm text-muted-foreground">
                      Sweet and playful with natural fruit extracts
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🍰</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Creamy Cheesecake</h3>
                    <p className="text-sm text-muted-foreground">
                      Rich and indulgent with nourishing ingredients
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🫐</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Blueberry Dreams</h3>
                    <p className="text-sm text-muted-foreground">
                      Antioxidant-rich with a delightful berry blend
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8">
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
                    Backer Benefits
                  </h3>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Campaign Details Section */}
          <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12 text-center">
                  Campaign Details
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Campaign Timeline</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      This is a self-hosted crowdfunding campaign to bring our innovative product to market. 
                      We're seeking 250 backers to help us reach our production target.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Deadline:</strong> June 30, 2026 or when we reach 250 backers (whichever comes first)
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Money-Back Guarantee</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      In the unlikely event that we are unable to reach our target by the deadline, 
                      the campaign will be cancelled.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>If cancelled:</strong> All backers will receive a full refund plus a complimentary 
                      discount voucher from the SkinLabs team.
                    </p>
                  </div>
                </div>

                {/* Product Development Timeline */}
                <div className="bg-card border border-border rounded-2xl p-8">
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Product Development Timeline
                  </h3>
                  <div className="space-y-6">
                    {timeline.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm text-primary font-medium mb-1">{item.phase}</p>
                          <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12 text-center">
                  How It Works
                </h2>

                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Pre-Order Your Bundle</h3>
                      <p className="text-muted-foreground">
                        Secure your exclusive bundle pack at the discounted pre-order price of {formatPrice(preOrderPrice)}.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Receive Your Backer's Guide</h3>
                      <p className="text-muted-foreground">
                        After placing your pre-order, you'll receive a comprehensive Backer's Guide via email and/or WhatsApp 
                        with all the important details about the product development process.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Track Progress in Real-Time</h3>
                      <p className="text-muted-foreground">
                        Stay updated on the current status of the product through our online Product Roadmap Tracking Tool. 
                        You can also log in to your dashboard on our website to track your package progress.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Receive Your Package</h3>
                      <p className="text-muted-foreground">
                        Once production and regulatory compliance is complete, your bundle will be prepared and delivered 
                        according to the expected turnaround time communicated in your Backer's Guide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-primary/5">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                  Be Part of This Innovation
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join the movement to bring the first edible skincare pouches in Africa to market. 
                  Support local innovation and get exclusive early access.
                </p>
                <Button size="lg" className="gap-2 text-lg h-14 px-8">
                  <Package className="h-5 w-5" />
                  Secure Your Pre-Order - {formatPrice(preOrderPrice)}
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Limited to 250 backers • Campaign ends June 30, 2026
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default EdiblePouches;
