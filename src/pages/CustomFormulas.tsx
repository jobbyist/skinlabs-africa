import { Helmet } from "react-helmet-async";
import { Sparkles, Beaker, Target, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CustomFormulas = () => {
  const steps = [
    {
      step: "1",
      title: "Skin Analysis",
      description: "Complete our comprehensive skin assessment questionnaire"
    },
    {
      step: "2",
      title: "Formula Creation",
      description: "Our lab creates your unique formula based on your profile"
    },
    {
      step: "3",
      title: "Delivery",
      description: "Receive your custom products with personalized instructions"
    }
  ];

  const formulas = [
    {
      icon: <Beaker className="h-8 w-8" />,
      name: "Custom Moisturizer",
      description: "Tailored hydration for your exact skin type and concerns",
      price: "R 799"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      name: "Bespoke Serum",
      description: "Personalized active ingredients at optimal concentrations",
      price: "R 899"
    },
    {
      icon: <Target className="h-8 w-8" />,
      name: "Custom Cleanser",
      description: "Gentle cleansing formula matched to your skin's needs",
      price: "R 599"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Custom Formulas - Personalized Skincare | SKINLABS</title>
        <meta
          name="description"
          content="Get custom-formulated skincare products created specifically for your unique skin type and concerns. Personalized moisturizers, serums, and cleansers."
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
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Custom Formulas
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Skincare formulated exclusively for you, based on your unique skin profile
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {steps.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {formulas.map((formula, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        {formula.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {formula.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {formula.description}
                      </p>
                      <div className="text-2xl font-bold text-primary mb-4">
                        {formula.price}
                      </div>
                      <Button className="w-full" size="sm">Customize</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    What Makes Our Custom Formulas Special?
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Lab-Created</h3>
                        <p className="text-sm text-muted-foreground">
                          Each formula is freshly made in our laboratory to your exact specifications
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Targeted Solution</h3>
                        <p className="text-sm text-muted-foreground">
                          Addresses your specific concerns with precision ingredient selection
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Premium Ingredients</h3>
                        <p className="text-sm text-muted-foreground">
                          Only the highest quality actives at clinically effective concentrations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Beaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Science-Backed</h3>
                        <p className="text-sm text-muted-foreground">
                          Formulated by dermatologists using proven research and data
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Ready for Your Custom Formula?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Start with our skin analysis to get your personalized recommendations
                  </p>
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    Start Skin Analysis
                  </Button>
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

export default CustomFormulas;
