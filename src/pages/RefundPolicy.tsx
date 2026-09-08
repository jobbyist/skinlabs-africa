import { Helmet } from "react-helmet-async";
import { RotateCcw, CreditCard, Calendar, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "28 August 2026";

const RefundPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Refund Policy | SkinLabs®</title>
        <meta name="description" content="SkinLabs refund rules for subscriptions, credit packs, virtual consultations and marketplace transactions under South African law." />
        <link rel="canonical" href="https://skinlabs.co.za/refund-policy" />
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
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Refund Policy</h1>
                  <p className="text-xl text-muted-foreground">Effective date: {EFFECTIVE}</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Scope</h2>
                  <p className="text-muted-foreground">
                    This Refund Policy applies to paid subscriptions (Glow Insider, Glow VIP), credit packs for SKYNN AI analyses,
                    virtual dermatologist consultation bookings facilitated through the Platform, and marketplace transactions where
                    SkinLabs acts as a payment-collection agent. It should be read with our Terms of Service. Nothing here limits your
                    mandatory rights under the Consumer Protection Act 68 of 2008 (CPA) or the Electronic Communications and Transactions Act 25 of 2002 (ECTA).
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">2. Subscriptions — 30-Day Money-Back Guarantee</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                      <p>If you subscribe to a paid membership <strong className="text-foreground">without</strong> first starting a free trial, you may request a full refund within 30 days of the initial charge.</p>
                      <p className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
                        <strong className="text-foreground">Important:</strong> Starting the free trial of Glow Insider (currently 7 days, no card required) forfeits the 30-day money-back guarantee. After the trial converts to a paid subscription, ordinary cancellation rights apply (access until the end of the paid period) but the full-refund guarantee does not.
                      </p>
                      <p>Refunds are processed to the original payment method within a reasonable period (typically 5–15 business days).</p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. ECTA Cooling-Off Rights</h2>
                    <p className="text-muted-foreground">
                      Where ECTA section 44 applies, a consumer may cancel without reason and without penalty within seven days after the conclusion of the agreement. Certain exclusions apply (including services that began with the consumer’s consent before the end of the period). The 30-day guarantee is additional to any applicable ECTA right.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Credit Packs for AI Analyses</h2>
                    <p className="text-muted-foreground">
                      Once a credit has been used to run an analysis it is consumed and non-refundable. Unused credits in an unexpired pack may be refunded within 14 days of purchase if no credit from that pack has been used. Expired or partially used packs are non-refundable except where required by law or in cases of clear service failure attributable to SkinLabs.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">5. Virtual Dermatologist Consultations</h2>
                    </div>
                    <div className="space-y-3 text-muted-foreground">
                      <p>When the consult feature is live, SkinLabs acts as a booking and payment-collection facilitator for independent HPCSA-registered practitioners. Cancellation rules will be shown at booking. As a general guideline:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Cancellations more than 24 hours before the scheduled consult may be eligible for a full refund of the consultation fee;</li>
                        <li>Cancellations within 24 hours or failure to attend may result in forfeiture or a partial refund at the practitioner’s discretion;</li>
                        <li>If the practitioner cancels, you will receive a full refund or the option to reschedule.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <ShoppingBag className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">6. Marketplace Transactions</h2>
                    </div>
                    <p className="text-muted-foreground">
                      When the multivendor marketplace is operational, SkinLabs collects payment as agent for the listed seller. The contract is between you and the seller. Refund and return requests should in the first instance be directed to the seller in accordance with the seller’s policy and the CPA. SkinLabs will cooperate in facilitating refunds of amounts it holds where the seller authorises a refund or a competent authority orders one.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. How to Request a Refund</h2>
                    <p className="text-muted-foreground mb-4">
                      Email <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a> with the subject “Refund Request”, your account email, transaction reference (if available), and a brief description. We aim to acknowledge within 2 business days.
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <p className="text-muted-foreground">Questions? Contact <a href="mailto:legal@skinlabs.co.za" className="text-primary font-medium hover:underline">legal@skinlabs.co.za</a></p>
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

export default RefundPolicy;
