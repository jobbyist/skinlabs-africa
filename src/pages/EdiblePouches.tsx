import { Helmet } from "react-helmet-async";
import { ShoppingCart, Clock, CheckCircle2, MapPin, Package, Users, ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import edibleImage from "@/assets/edible-skincare-pouches.png";

const BACKERS_COUNT = 47;
const BACKERS_TARGET = 250;
const CAMPAIGN_END = "30 June 2026";

const EdiblePouches = () => {
  const progressPercent = (BACKERS_COUNT / BACKERS_TARGET) * 100;

  const flavors = [
    { name: "Bubblegum Pop", description: "Sweet and playful with natural fruit extracts" },
    { name: "Creamy Cheesecake", description: "Rich and indulgent with nourishing ingredients" },
    { name: "Blueberry Dreams", description: "Antioxidant-rich with a delightful berry blend" },
  ];

  const roadmapSteps = [
    { label: "Research & Development", status: "done" },
    { label: "Formulation & Testing", status: "done" },
    { label: "Production & Regulatory Compliance", status: "current" },
    { label: "Manufacturing & Packaging", status: "upcoming" },
    { label: "Fulfilment & Delivery", status: "upcoming" },
  ];

  return (
    <>
      <Helmet>
        <title>Pre-Order Edible Skincare Pouches | SKINLABS</title>
        <meta name="description" content="Back our self-hosted crowdfunding campaign and be among the first 250 backers to get the SkinLabs® Edible Skincare Pouches bundle at a discounted price of R299." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 text-sm font-semibold">
                    <Package className="h-4 w-4" />
                    Self-Hosted Crowdfunding Campaign
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Edible Skincare Pouches
                  </h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    Help us bring this groundbreaking innovation to market. Back our campaign and receive a bundled pack featuring all variants of our Edible Skincare Pouches at an exclusive discounted price.
                  </p>

                  {/* Price */}
                  <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-bold text-foreground">R299</span>
                      <span className="text-muted-foreground">once-off</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bundled pack featuring all 3 flavour variants
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" /> {BACKERS_COUNT} backers
                      </span>
                      <span className="text-muted-foreground">{BACKERS_TARGET} target</span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Campaign ends {CAMPAIGN_END} or when target is reached
                    </p>
                  </div>

                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <ShoppingCart className="h-5 w-5" />
                    Back This Campaign — R299
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
                  <img
                    src={edibleImage}
                    alt="Edible Skincare Pouches bundle"
                    className="relative rounded-2xl shadow-2xl w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* What You Get */}
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-8 text-center">
                What's Included
              </h2>
              <div className="grid sm:grid-cols-3 gap-6">
                {flavors.map((f) => (
                  <div key={f.name} className="bg-card border border-border rounded-2xl p-6 text-center">
                    <h3 className="font-semibold text-foreground mb-2">{f.name}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-8 text-center">
                How It Works
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Place your pre-order</h3>
                    <p className="text-sm text-muted-foreground">Secure your spot as one of the first 250 backers at the discounted price of R299.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Receive your Backer's Guide</h3>
                    <p className="text-sm text-muted-foreground">You'll receive a comprehensive guide via email and/or WhatsApp with everything you need to know, including access to our live Product Roadmap Tracking Tool.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Track your package</h3>
                    <p className="text-sm text-muted-foreground">Log in to your dashboard on our website to track the progress of your package in real time.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Roadmap */}
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-8 text-center">
                Product Roadmap
              </h2>
              <div className="space-y-4">
                {roadmapSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === "done" ? "bg-primary text-primary-foreground" :
                      step.status === "current" ? "bg-primary/20 border-2 border-primary text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {step.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.status === "current" ? "text-primary" : step.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                        {step.status === "current" && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">In Progress</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Campaign Terms */}
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6 text-center">
                Campaign Terms
              </h2>
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4 text-sm text-muted-foreground">
                <p>• This pre-order campaign is limited to <strong className="text-foreground">250 backers</strong> and will end as soon as we reach the target.</p>
                <p>• In the unlikely event that we are unable to reach the target by the end of <strong className="text-foreground">June 2026</strong>, the campaign will be cancelled and all backers will receive a <strong className="text-foreground">full refund</strong> and a complimentary discount voucher from the SkinLabs team.</p>
                <p>• The product is currently in the <strong className="text-foreground">production and regulatory compliance</strong> phase. Estimated delivery timelines will be communicated via the Backer's Guide and Product Roadmap Tracking Tool.</p>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">Have questions about the campaign?</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a href="mailto:support@skinlabs.co.za" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" /> support@skinlabs.co.za
                  </a>
                  <a href="tel:0128806560" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone className="h-4 w-4" /> 012 880 6560
                  </a>
                  <a href="https://wa.me/27128806560" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
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

export default EdiblePouches;
