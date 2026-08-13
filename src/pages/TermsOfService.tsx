import { Helmet } from "react-helmet-async";
import { FileText, Shield, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Legal Agreement | SKINLABS</title>
        <meta
          name="description"
          content="Read SkinLabs' terms of service governing the use of our website, products, and services."
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
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Terms of Service
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Last updated: December 2024
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Agreement to Terms</h2>
                  <p className="text-muted-foreground mb-4">
                    By accessing or using SkinLabs' website and services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                  </p>
                  <p className="text-muted-foreground">
                    These Terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Use of Service</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Use the Service in any way that violates any applicable law or regulation</li>
                        <li>Impersonate or attempt to impersonate SkinLabs, a SkinLabs employee, another user, or any other person or entity</li>
                        <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
                        <li>Use any robot, spider, or other automatic device to access the Service</li>
                        <li>Introduce any viruses, trojan horses, worms, or other material that is malicious or technologically harmful</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Account Registration</h2>
                    <p className="text-muted-foreground mb-4">
                      To access certain features of the Service, you may be required to create an account. You agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li>Provide accurate, current, and complete information</li>
                      <li>Maintain and update your information to keep it accurate</li>
                      <li>Maintain the security of your password</li>
                      <li>Accept all responsibility for activity under your account</li>
                      <li>Notify us immediately of any unauthorized use of your account</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Content and AI Recommendations</h2>
                    <div className="space-y-4 text-muted-foreground">
                      <p>SkinLabs does not sell or ship physical products. AI Formulator recommendations, Newsroom briefings, and product reviews are provided for general informational purposes and are subject to change without notice.</p>
                      <p>We reserve the right to:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Update or correct any AI-generated recommendation, review, or briefing at any time</li>
                        <li>Suspend or discontinue any feature of the platform</li>
                        <li>Correct pricing errors on membership plans</li>
                      </ul>
                      <p>Retailer pricing and stock information shown in Reviews is sourced independently and may change without notice — always confirm current pricing on the retailer's own site before purchasing.</p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Membership & Payment Terms</h2>
                    <p className="text-muted-foreground mb-4">
                      Glow Insider and Glow VIP are recurring monthly subscriptions billed in South African Rand (ZAR). Payment is processed securely via PayFast and is due at the start of each billing cycle. You may cancel at any time from your account dashboard, effective at the end of the current billing period.
                    </p>
                    <p className="text-muted-foreground">
                      By providing payment information, you represent and warrant that you are authorized to use the designated payment method and authorize us to charge your payment method for each recurring subscription period until cancelled.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">Intellectual Property</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      The Service and its original content, features, and functionality are owned by SkinLabs and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                    <p className="text-muted-foreground">
                      You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any of our content without our express written permission.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">Disclaimer of Warranties</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. SKINLABS MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, REGARDING THE SERVICE, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>
                    <p className="text-muted-foreground">
                      Results from using our products and services may vary. We do not guarantee specific results from use of our products.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
                    <p className="text-muted-foreground mb-4">
                      IN NO EVENT SHALL SKINLABS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES.
                    </p>
                    <p className="text-muted-foreground">
                      Our liability to you for any cause whatsoever shall not exceed the amount you paid for the product or service giving rise to the claim.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
                    <p className="text-muted-foreground">
                      These Terms shall be governed by and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of South Africa.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
                    <p className="text-muted-foreground">
                      We reserve the right to modify or replace these Terms at any time. Material changes will be notified at least 30 days before taking effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Questions About These Terms?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    If you have any questions about these Terms of Service, please contact us
                  </p>
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
