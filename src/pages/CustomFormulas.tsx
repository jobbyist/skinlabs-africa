import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Sparkles, Beaker, Target, Award, Droplet, FlaskConical } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import CustomFormulaRequestModal from "@/components/CustomFormulaRequestModal";

const CustomFormulas = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Serum");

  const openModal = (type: string) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const steps = [
    { step: "1", title: "Skin Analysis", description: "Complete our AI-powered skin assessment or share your existing profile" },
    { step: "2", title: "Lab Formulation", description: "Our formulation chemists design your unique product to spec" },
    { step: "3", title: "Delivery", description: "Freshly made and shipped with personalised routine instructions" },
  ];

  const formulas = [
    { icon: <Beaker className="h-8 w-8" />, name: "Moisturizers", description: "Custom-weighted hydration matched to your barrier and climate.", price: "From R 799", type: "Moisturizer" },
    { icon: <Sparkles className="h-8 w-8" />, name: "Serums", description: "Precision actives at clinically effective concentrations for your goals.", price: "From R 899", type: "Serum" },
    { icon: <Droplet className="h-8 w-8" />, name: "Cleansers", description: "Gentle, pH-balanced cleansing tuned to your skin type and routine.", price: "From R 599", type: "Cleanser" },
    { icon: <FlaskConical className="h-8 w-8" />, name: "Scrubs", description: "Physical + enzymatic exfoliation calibrated to your tolerance level.", price: "From R 649", type: "Scrub" },
  ];

  return (
    <>
      <Helmet>
        <title>Custom Formulas - Lab-Formulated Skincare | SKINLABS</title>
        <meta name="description" content="Bespoke skincare formulated in the SkinLabs lab. Custom serums, moisturizers, cleansers and scrubs made to your unique skin profile." />
        <link rel="canonical" href="https://skinlabs.co.za/custom-formulas" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "SkinLabs Custom Formulas",
          itemListElement: formulas.map((formula, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Service",
              name: `Custom ${formula.name}`,
              description: formula.description,
              provider: { "@type": "Organization", name: "SkinLabs" },
              areaServed: "ZA",
              offers: {
                "@type": "Offer",
                price: formula.price.replace(/[^0-9.]/g, ""),
                priceCurrency: "ZAR",
                url: "https://skinlabs.co.za/custom-formulas",
              },
            },
          })),
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Custom Formulas</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    SkinLabs is a formulation laboratory. Every product is built in-house, to spec, for one skin — yours.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                  {steps.map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {formulas.map((f) => (
                    <div key={f.type} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow flex flex-col">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">{f.icon}</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{f.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{f.description}</p>
                      <div className="text-xl font-bold text-primary mb-4">{f.price}</div>
                      <Button className="w-full" size="sm" onClick={() => openModal(f.type)}>Customize</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">What Makes Our Custom Formulas Special?</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Lab-Created</h3>
                        <p className="text-sm text-muted-foreground">Freshly compounded in our lab to your exact brief — no mass production.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Targeted Solution</h3>
                        <p className="text-sm text-muted-foreground">Concerns → actives → concentrations, all mapped by our formulation team.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Premium Ingredients</h3>
                        <p className="text-sm text-muted-foreground">Pharmaceutical-grade actives and locally sourced botanicals.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Beaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Science-Backed</h3>
                        <p className="text-sm text-muted-foreground">Every formula is dermatologist-reviewed against current clinical evidence.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Ready for Your Custom Formula?</h2>
                  <p className="text-muted-foreground mb-6">Start with a full AI skin analysis so we can formulate against real data.</p>
                  <Button size="lg" className="gap-2" asChild>
                    <Link to="/ai-formulator">
                      <Sparkles className="h-5 w-5" />
                      Start Skin Analysis
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      <CustomFormulaRequestModal open={modalOpen} onOpenChange={setModalOpen} productType={selectedType} />
    </>
  );
};

export default CustomFormulas;
