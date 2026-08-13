import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { Check, Sparkles, Crown, ShieldCheck, Gift, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthDialog from "@/components/AuthDialog";
import { trackEvent } from "@/lib/analytics";

const ALLOWED_PLANS = ["glow-insider", "vip"];

const GetStarted = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const features = [
    "AI-Powered Custom Skincare Routine Formulator",
    "Skincare Results Tracking System",
    "Access to the exclusive OPENHAUS marketplace",
    "Loyalty program with redeemable points for free sample kits",
    "Sponsored giveaways and discounts from partners",
    "Exclusive skincare guides and resources",
    "Full, uninterrupted access to SkinDeep by SkinLabs® podcast",
    "Early access to new product releases",
    "Priority Customer Support",
    "30-Day Money Back Guarantee",
  ];

  const handleSubscribe = async () => {
    if (!user || user.is_anonymous || !user.email) {
      setShowAuthDialog(true);
      return;
    }

    const plan = searchParams.get("plan") ?? "glow-insider";

    // Validate plan parameter
    if (!ALLOWED_PLANS.includes(plan)) {
      toast.error("Invalid plan selected. Please choose a valid membership plan.");
      return;
    }

    // Block checkout for Explorer (free tier)
    if (plan === "Explorer" || plan === "explorer") {
      toast.error("Explorer is a free tier. No payment required.");
      return;
    }

    setProcessing(true);
    trackEvent("subscription_checkout_started", { source: "get_started", plan });
    try {
      const { data, error } = await supabase.functions.invoke("payfast-payment", {
        body: {
          type: "subscription",
          plan,
          userId: user.id,
          email: user.email,
          returnUrl: `${window.location.origin}/get-started?payment=success`,
          cancelUrl: `${window.location.origin}/get-started?payment=cancelled`,
        },
      });
      if (error) throw error;
      if (data?.paymentUrl && data?.paymentData) {
        // Create form and submit to PayFast
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      }
    } catch (err: any) {
      toast.error("Failed to initiate payment. Please try again.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Get Started - Premium SkinLabs® Account | SKINLABS</title>
        <meta
          name="description"
          content="Upgrade to a premium SkinLabs® account for R99/month. Unlock AI-powered skincare formulations, OPENHAUS marketplace, loyalty rewards, and more."
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
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Upgrade to Premium
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Unlock all features on our platform and transform your skincare journey with a premium SkinLabs® account
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
                  <div className="text-center mb-8">
                    <div className="inline-block bg-primary/10 rounded-full px-4 py-1 mb-4">
                      <span className="text-sm font-medium text-primary">Premium SkinLabs® Account</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-foreground">R99</span>
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

                  <Button
                    className="w-full h-14 text-lg gap-2"
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    {processing ? "Processing..." : "Subscribe Now — R99/month"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Your subscription will begin immediately. Cancel anytime within 30 days for a full refund.
                  </p>
                </div>

                <div className="mt-16 grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Science-Backed</h3>
                    <p className="text-sm text-muted-foreground">
                      All recommendations based on dermatological research
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">AI-Powered</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI creates personalized routines just for you
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Exclusive Access</h3>
                    <p className="text-sm text-muted-foreground">
                      OPENHAUS marketplace, loyalty rewards, and early releases
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  );
};

export default GetStarted;
