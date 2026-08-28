import { Helmet } from "react-helmet-async";
import { RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Returns = () => {
  return (
    <>
      <Helmet>
        <title>Returns Policy - 30-Day Guarantee | SKINLABS</title>
        <meta
          name="description"
          content="How to return a SkinLabs order: the 30-day money-back guarantee, what condition items need to be in, and how refunds get processed."
        />
        <link rel="canonical" href="https://skinlabs.co.za/returns" />
        <meta property="og:title" content="Returns Policy | SKINLABS" />
        <meta property="og:description" content="A 30-day money-back guarantee and a straightforward returns process." />
        <meta property="og:url" content="https://skinlabs.co.za/returns" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <RotateCcw className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Returns Policy
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    A 30-day money-back guarantee, so trying something new doesn't feel risky
                  </p>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 md:p-12 mb-12 text-center">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    30-Day Money-Back Guarantee
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Not right for your skin? Return it within 30 days for a full refund — no interrogation required.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">How to return an item</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Contact Us</h3>
                        <p className="text-muted-foreground">
                          Email support@skinlabs.co.za with your order number and reason for return. We'll respond within 24 hours.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Receive Return Label</h3>
                        <p className="text-muted-foreground">
                          We'll send you a prepaid return shipping label and instructions via email.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Ship the Item</h3>
                        <p className="text-muted-foreground">
                          Pack the item securely in its original packaging (if possible) and attach the return label.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Get Your Refund</h3>
                        <p className="text-muted-foreground">
                          Once we receive your return, we'll process your refund within 5-7 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Return Conditions</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Items must be returned within 30 days of delivery
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Products should be unused or gently used with at least 50% remaining
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Items must be in original packaging when possible
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Custom formulas can be returned for quality issues only
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <h2 className="text-2xl font-bold text-foreground">Important Notes</h2>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Refunds are issued to the original payment method</li>
                    <li>• Return shipping is free - we provide prepaid labels</li>
                    <li>• It may take 5-10 business days for the refund to appear in your account</li>
                    <li>• Items damaged during return shipping are not eligible for refund</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Need a hand with a return?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our support team can walk you through it
                  </p>
                  <a href="mailto:support@skinlabs.co.za" className="text-primary font-medium hover:underline text-lg">
                    support@skinlabs.co.za
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

export default Returns;
