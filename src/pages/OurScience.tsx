import { Helmet } from "react-helmet-async";
import { Microscope, Beaker, Brain, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const OurScience = () => {
  const pillars = [
    {
      icon: <Microscope className="h-8 w-8" />,
      title: "Research-Driven",
      description: "Every product is backed by peer-reviewed dermatological research and clinical studies"
    },
    {
      icon: <Beaker className="h-8 w-8" />,
      title: "Active Ingredients",
      description: "We use clinically proven concentrations of actives that deliver measurable results"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Technology",
      description: "Advanced algorithms analyze thousands of skin profiles to create optimal formulations"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Expert Team",
      description: "Our dermatologists and chemists ensure every formula meets the highest standards"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Our Science - Research & Methodology | SKINLABS</title>
        <meta name="description" content="Learn about the science behind SkinLabs. Our research-driven approach combines dermatology, chemistry, and AI to create effective skincare." />
        <link rel="canonical" href="https://skinlabs.co.za/our-science" />
        <meta property="og:title" content="Our Science - Research & Methodology | SKINLABS" />
        <meta property="og:description" content="Research-driven skincare combining dermatology, chemistry, and AI." />
        <meta property="og:url" content="https://skinlabs.co.za/our-science" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Our Science
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Where dermatological research meets cutting-edge technology
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Approach</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      At SkinLabs, we believe that effective skincare should be grounded in science, not trends. Our methodology combines decades of dermatological research with modern AI technology to create formulations that actually work.
                    </p>
                    <p>
                      Every ingredient we use has been studied extensively and proven effective in peer-reviewed clinical trials. We don't use fillers, fragrances, or trendy ingredients that lack scientific backing.
                    </p>
                    <p>
                      Our AI platform analyzes over 10,000 data points including skin type, concerns, environmental factors, and lifestyle to recommend the optimal combination of products and actives for each individual.
                    </p>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    Science Pillars
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {pillars.map((pillar, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {pillar.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {pillar.title}
                        </h3>
                        <p className="text-muted-foreground">{pillar.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Our Testing Process</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">1. Formulation Development</h3>
                      <p className="text-sm text-muted-foreground">
                        Our chemists create formulas using clinically proven ingredients at optimal pH and concentrations
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">2. Stability Testing</h3>
                      <p className="text-sm text-muted-foreground">
                        Products undergo rigorous stability and safety testing under various conditions
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3. Clinical Trials</h3>
                      <p className="text-sm text-muted-foreground">
                        Independent clinical studies validate efficacy and safety on diverse skin types
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">4. Dermatologist Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Board-certified dermatologists review all data before product launch
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Commitment to Excellence
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    We're continuously researching and innovating to bring you the most effective, science-backed skincare solutions
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

export default OurScience;
