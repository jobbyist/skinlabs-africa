import { Helmet } from "react-helmet-async";
import { Check, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const GetStarted = () => {
  const features = [
    "AI-Powered Custom Skincare Routine Formulator",
    "Skincare Results Tracking System",
    "Free Sample Kits from SkinLabs Product Development Team",
    "Regular Giveaways and Discounts from Partners",
    "Skincare Guides and Resources",
    "Weekly Podcast Series: SkinDeep by SkinLabs®",
    "Early Access to New Product Releases",
    "Priority Customer Support",
    "Exclusive Member-Only Content",
    "30-Day Money Back Guarantee"
  ];

  return (
    <>
      <Helmet>
        <title>Get Started - Premium Membership | SKINLABS</title>
        <meta
          name="description"
          content="Unlock all premium features on SKINLABS for just $4.99/month. AI-powered skincare formulations, tracking, exclusive content, and more."
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
                    Unlock Your Best Skin
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Get unlimited access to our most powerful features and transform your skincare routine
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
                  <div className="text-center mb-8">
                    <div className="inline-block bg-primary/10 rounded-full px-4 py-1 mb-4">
                      <span className="text-sm font-medium text-primary">Premium Membership</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-foreground">R49.99</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cancel anytime • 30-day money back guarantee
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full h-14 text-lg gap-2" size="lg">
                    <Sparkles className="h-5 w-5" />
                    Start Your Free Trial
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Your subscription will begin after the 30-day trial period. Cancel anytime within 30 days for a full refund.
                  </p>
                </div>

                <div className="mt-16 grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔬</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Science-Backed</h3>
                    <p className="text-sm text-muted-foreground">
                      All recommendations based on dermatological research
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">AI-Powered</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI creates personalized routines just for you
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Exclusive Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Be first to access new features and products
                    </p>
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

export default GetStarted;
