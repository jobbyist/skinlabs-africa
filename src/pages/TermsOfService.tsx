import { Helmet } from "react-helmet-async";
import { FileText, Shield, AlertCircle, RotateCcw, Scale, Users, ShoppingBag, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "28 August 2026";

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | SkinLabs®</title>
        <meta
          name="description"
          content="Terms governing use of SkinLabs, SKYNN AI and related services. Non-diagnostic cosmetic assessment only. POPIA and SAHPRA aligned."
        />
        <link rel="canonical" href="https://skinlabs.co.za/terms-of-service" />
        <meta property="og:title" content="Terms of Service | SkinLabs®" />
        <meta property="og:description" content="Legal terms for SkinLabs Platform and SKYNN AI." />
        <meta property="og:url" content="https://skinlabs.co.za/terms-of-service" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Terms of Service</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Effective date: {EFFECTIVE} · Version 1.0
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Governing law: Republic of South Africa · Contact: legal@skinlabs.co.za
                  </p>
                </div>

                {/* Foundational notice */}
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 mb-8">
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>Foundational criteria.</strong> All content, SKYNN AI outputs, scores, routines and recommendations
                    on the Platform are for general educational and <strong>cosmetic-information purposes only</strong>. They do{" "}
                    <strong>not</strong> constitute medical advice, diagnosis or treatment. They are not a substitute for
                    consultation with an HPCSA-registered healthcare practitioner. SkinLabs is not a medical device manufacturer
                    or healthcare provider under SAHPRA frameworks for diagnostic purposes. This non-diagnostic methodology is a
                    foundational design criterion across the entire Platform architecture, including special personal information
                    processing under POPIA.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of these Terms</h2>
                  <p className="text-muted-foreground mb-4">
                    These Terms of Service (“Terms”) govern your access to and use of the SkinLabs® website, SKYNN AI tools,
                    content, subscription services, marketplace features and any related applications or services (collectively,
                    the “Platform”) operated by SkinLabs® (“SkinLabs”, “we”, “us” or “our”). By accessing or using the Platform,
                    creating an account, starting a free trial, or purchasing any paid service, you agree to be bound by these
                    Terms and our Privacy Policy, Cookie Policy, Refund Policy, Editorial Policy and Community Guidelines. If you
                    do not agree, do not use the Platform.
                  </p>
                  <p className="text-muted-foreground">
                    These Terms constitute a binding agreement under South African law, including the Electronic Communications
                    and Transactions Act 25 of 2002 (ECTA), the Consumer Protection Act 68 of 2008 (CPA) and the Protection of
                    Personal Information Act 4 of 2013 (POPIA).
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of the Platform</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs provides evidence-oriented skincare intelligence tailored to South African skin, climate and product
                      availability. Features include (subject to availability and tier):
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>Editorial content, product reviews, comparisons (“Shelf Showdowns”), rankings and educational briefings</li>
                      <li>SKYNN AI — an AI-powered cosmetic skin-assessment and routine-suggestion tool (BETA)</li>
                      <li>Subscription memberships (Glow Explorer free tier; Glow Insider and Glow VIP paid tiers)</li>
                      <li>Credit packs for additional AI analyses</li>
                      <li>Practitioner directory and (when live) booking of virtual consultations with independent HPCSA-registered practitioners</li>
                      <li>Multivendor marketplace features in which SkinLabs may act as a payment-collection agent for listed third-party sellers</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">3. SKYNN AI and special personal information</h2>
                    </div>
                    <div className="space-y-3 text-muted-foreground">
                      <p>
                        Use of SKYNN AI involves the collection and processing of photographic images and derived skin metrics.
                        Under POPIA these may constitute special personal information. By using SKYNN AI you acknowledge that:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Processing is limited to cosmetic skin assessment and personalised routine suggestions — not medical diagnosis</li>
                        <li>Explicit consent is required before image capture or upload</li>
                        <li>Raw images are retained only for the short period needed to complete analysis (unless you save results)</li>
                        <li>We do not use images for facial recognition or identity verification</li>
                        <li>Full details are set out in our{" "}
                          <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Eligibility and accounts</h2>
                    <p className="text-muted-foreground">
                      You must be at least 18 years old (or the age of majority in your jurisdiction) and capable of entering a
                      binding contract to use paid features or create an account. You are responsible for maintaining the
                      confidentiality of your login credentials and for all activity under your account. You must provide accurate
                      information and update it promptly. We may suspend or terminate accounts that violate these Terms or applicable law.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Subscriptions, trials, billing and cancellation</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p>
                        Paid memberships (Glow Insider, Glow VIP and any future tiers) are offered on monthly or annual cycles.
                        Prices are displayed in South African Rand (ZAR) and include applicable VAT where we are registered. A free
                        trial of Glow Insider may be offered (currently 7 days, no card required). Starting a free trial forfeits the
                        30-day money-back guarantee that otherwise applies to direct paid subscriptions. Full details appear in our{" "}
                        <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
                      </p>
                      <p>
                        Subscriptions renew automatically at the end of each billing period unless cancelled via your account
                        dashboard before the renewal date. You may cancel at any time; access continues until the end of the current
                        paid period. You authorise us (and our processors) to charge the payment method on file for recurring fees
                        and any applicable taxes. We may change pricing or features with reasonable notice. Fixed-term consumer
                        agreements are subject to CPA section 14 limits where applicable.
                      </p>
                    </div>
                  </div>

                  <div id="money-back-guarantee" className="bg-card border border-border rounded-3xl p-8 md:p-12 scroll-mt-24">
                    <div className="flex items-start gap-3 mb-4">
                      <RotateCcw className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">6. 30-day money-back guarantee (summary)</h2>
                    </div>
                    <div className="space-y-3 text-muted-foreground">
                      <p>
                        Every paid SkinLabs membership purchased by direct subscription (without first starting a free trial) is
                        covered by a 30-day money-back guarantee. If you start a free trial, you forfeit that guarantee for that plan.
                        See the full{" "}
                        <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>{" "}
                        for credit packs, consultation bookings and marketplace rules.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <ShoppingBag className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">7. Credit packs and marketplace</h2>
                    </div>
                    <p className="text-muted-foreground">
                      Credit packs for additional SKYNN AI analyses are non-transferable and subject to the Refund Policy. When the
                      multivendor marketplace is live, SkinLabs acts solely as a payment-collection and facilitation agent for listed
                      third-party sellers. Contracts for goods or services sold on the marketplace are between you and the relevant
                      seller. SkinLabs is not the seller of those items unless expressly stated. Seller terms, delivery and product
                      liability rest primarily with the seller, subject to any non-excludable CPA rights.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">8. Virtual dermatologist consultations</h2>
                    </div>
                    <p className="text-muted-foreground">
                      When available, virtual consultations are provided by independent HPCSA-registered practitioners. SkinLabs
                      facilitates booking and payment collection only. The practitioner–patient relationship is solely between you and
                      the practitioner. Practitioners must comply with HPCSA ethical rules (including Booklet 16 and telemedicine
                      guidance). SkinLabs does not provide clinical care, does not employ the practitioners for clinical purposes, and
                      does not accept liability for clinical decisions. Consultations are not a substitute for emergency care.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. User obligations and acceptable use</h2>
                    <p className="text-muted-foreground mb-3">You agree not to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>Use the Platform for any unlawful purpose or in violation of these Terms or Community Guidelines</li>
                      <li>Upload unlawful, harmful, infringing, defamatory or misleading content</li>
                      <li>Attempt to reverse-engineer, scrape, overload or interfere with the Platform or SKYNN AI</li>
                      <li>Misrepresent AI outputs or SkinLabs content as medical advice</li>
                      <li>Share account credentials or allow unauthorised access</li>
                      <li>Use automated means to access the Platform without our prior written permission</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">10. Intellectual property</h2>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      All content, trademarks, logos, software, databases (including structured product/ingredient data), AI models,
                      methodologies (including climate-fit scoring) and design elements on the Platform are owned by or licensed to
                      SkinLabs and are protected by South African and international intellectual-property laws. You receive a limited,
                      non-exclusive, non-transferable licence to access and use the Platform for personal, non-commercial purposes in
                      accordance with these Terms. You may not copy, modify, distribute, sell or create derivative works except as
                      expressly permitted.
                    </p>
                    <p className="text-muted-foreground">
                      User-generated content remains yours; by posting you grant SkinLabs a worldwide, royalty-free licence to use,
                      display and distribute it in connection with the Platform.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">11. Disclaimers</h2>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      THE PLATFORM AND ALL CONTENT AND AI OUTPUTS ARE PROVIDED “AS IS” AND “AS AVAILABLE”. TO THE MAXIMUM EXTENT
                      PERMITTED BY SOUTH AFRICAN LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE
                      UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS, OR THAT RESULTS WILL MEET YOUR EXPECTATIONS. SKYNN AI
                      RESULTS ARE ESTIMATES BASED ON VISIBLE CHARACTERISTICS AND AVAILABLE DATA; THEY ARE NOT CLINICALLY VALIDATED
                      DIAGNOSES.
                    </p>
                    <p className="text-muted-foreground">
                      Nothing in these Terms excludes or limits any rights that cannot be excluded under the CPA or other mandatory
                      consumer legislation.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">12. Limitation of liability</h2>
                    <p className="text-muted-foreground mb-3">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKINLABS AND ITS OFFICERS, DIRECTORS, EMPLOYEES AND AGENTS SHALL NOT
                      BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
                      DATA, GOODWILL OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF THE PLATFORM OR RELIANCE ON ANY CONTENT OR
                      AI OUTPUT. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE
                      PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR R1 000 IF
                      YOU HAVE PAID NOTHING. THESE LIMITATIONS APPLY EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE. MANDATORY CPA
                      REMEDIES REMAIN AVAILABLE WHERE APPLICABLE.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">13. Indemnity</h2>
                    <p className="text-muted-foreground">
                      You agree to indemnify and hold harmless SkinLabs and its officers, directors, employees and agents from any
                      claims, losses, damages, liabilities and expenses (including reasonable legal fees) arising out of your use of
                      the Platform, your content, your breach of these Terms, or your violation of any law or third-party right.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">14. Termination</h2>
                    <p className="text-muted-foreground">
                      We may suspend or terminate your access immediately if you breach these Terms, create risk or legal exposure
                      for us, or for prolonged inactivity. You may stop using the Platform at any time and cancel paid subscriptions
                      as described above. Upon termination, your right to use the Platform ceases; provisions that by their nature
                      should survive (including intellectual property, disclaimers, limitations of liability and indemnity) will survive.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">15. Governing law and dispute resolution</h2>
                    </div>
                    <p className="text-muted-foreground">
                      These Terms are governed by the laws of the Republic of South Africa. Subject to any mandatory consumer rights
                      of access to courts or tribunals (including the National Consumer Tribunal or Consumer Goods and Services Ombud
                      where applicable), any dispute arising out of or relating to these Terms or the Platform shall be subject to the
                      exclusive jurisdiction of the courts of South Africa. Nothing prevents either party from seeking urgent interim relief.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">16. Changes to these Terms</h2>
                    <p className="text-muted-foreground">
                      We may update these Terms from time to time. Material changes will be notified by updating the Effective Date,
                      posting a notice on the Platform and/or emailing registered users. Continued use after the effective date
                      constitutes acceptance of the revised Terms, subject always to non-excludable statutory rights.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">17. General</h2>
                    <p className="text-muted-foreground">
                      If any provision is held invalid or unenforceable, the remaining provisions remain in full force. Our failure to
                      enforce any right is not a waiver. These Terms, together with the policies referenced herein, constitute the
                      entire agreement between you and SkinLabs regarding the Platform and supersede prior agreements on the same
                      subject. You may not assign these Terms without our prior written consent; we may assign them in connection with
                      a merger, acquisition or sale of assets.
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Questions about these Terms?</h2>
                  <p className="text-muted-foreground mb-6">Contact us at</p>
                  <a href="mailto:legal@skinlabs.co.za" className="text-primary font-medium hover:underline text-lg">
                    legal@skinlabs.co.za
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

export default TermsOfService;
