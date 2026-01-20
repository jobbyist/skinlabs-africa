import { Helmet } from "react-helmet-async";
import { Sparkles, Brain, Target, Microscope } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const AIFormulator = () => {
  const steps = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Skin Analysis",
      description: "Answer questions about your skin type, concerns, and goals"
    },
    {
      icon: <Microscope className="h-8 w-8" />,
      title: "AI Processing",
      description: "Our advanced AI analyzes your profile using dermatological data"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Custom Routine",
      description: "Receive your personalized skincare routine and product recommendations"
    }
  ];

  return (
    <>
      <Helmet>
        <title>AI Formulator - Custom Skincare Routine | SKINLABS</title>
        <meta
          name="description"
          content="Get your personalized skincare routine with our AI-powered formulator. Science-backed recommendations tailored to your unique skin."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    AI-Powered Skincare Formulator
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Discover your perfect skincare routine with personalized recommendations powered by artificial intelligence
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {steps.map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                        {step.icon}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Start Your Skin Analysis
                  </h2>
                  <p className="text-muted-foreground text-center mb-8">
                    Takes only 3-5 minutes to complete. Get instant personalized recommendations based on your unique skin profile.
                  </p>
                  <Button className="w-full h-14 text-lg gap-2" size="lg">
                    <Sparkles className="h-5 w-5" />
                    Begin Analysis
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                    <p className="text-sm text-muted-foreground">Custom Routines Created</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">95%</div>
                    <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">Science</div>
                    <p className="text-sm text-muted-foreground">Dermatology-Backed</p>
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

export default AIFormulator;
