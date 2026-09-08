import { Helmet } from "react-helmet-async";
import { BookOpen, ShieldCheck, Scale, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "28 August 2026";

const EditorialPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Editorial Policy | SkinLabs®</title>
        <meta name="description" content="How SkinLabs maintains editorial independence, evidence standards and transparency in reviews, scores and content." />
        <link rel="canonical" href="https://skinlabs.co.za/editorial-policy" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Editorial Policy</h1>
                  <p className="text-xl text-muted-foreground">Effective date: {EFFECTIVE}</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Purpose</h2>
                  <p className="text-muted-foreground">
                    This Editorial Policy governs all content on the SkinLabs Platform — articles, reviews, Shelf Showdowns, rankings, Daily Skinny briefings, podcast notes and educational material. It supports our commitment to evidence-oriented, independent skincare intelligence for South African users.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">2. Independence</h2>
                    </div>
                    <p className="text-muted-foreground">
                      SkinLabs maintains editorial independence. Our “no affiliate” stance means we do not earn commission from product sales via hidden or undisclosed affiliate links in scored reviews or comparative content. Commercial relationships (if any) are separated from scoring and verdict processes.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">3. Evidence & Substantiation</h2>
                    </div>
                    <p className="text-muted-foreground">
                      Claims, scores and comparative statements must be capable of objective substantiation. We hold documentary evidence before publication. Comparative advertising and scoring comply with the CPA (sections 29 and 41) and, where applicable, Advertising Regulatory Board principles of fair, verifiable comparison.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Transparency</h2>
                    <p className="text-muted-foreground">
                      Any material connection (payment, free product, sponsored placement) is disclosed clearly. Sponsored “Spotlight” or brand placements, if offered, are labelled as paid and walled off from independent scored reviews. Methodology for scores (including climate-fit and local-relevance factors) is explained or linked.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">5. AI-Assisted Content</h2>
                    </div>
                    <p className="text-muted-foreground">
                      SkinLabs may use AI tools to assist research, drafting or personalisation. Final editorial responsibility remains with human reviewers for published reviews, scores and comparative claims. SKYNN AI outputs shown to users are generated algorithmically, labelled as such, and carry the standard non-diagnostic disclaimer.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Medical & Cosmetic Boundaries</h2>
                    <p className="text-muted-foreground">
                      Content stays on the cosmetic and educational side of the regulatory line. We do not make disease-treatment claims. Readers are directed to consult HPCSA-registered practitioners for personal medical advice. This aligns with SAHPRA expectations for cosmetic-related communications.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Corrections</h2>
                    <p className="text-muted-foreground">
                      If you believe Content contains a significant factual error, email <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a> with the URL and supporting information. We will investigate and, where appropriate, correct or clarify the Content.
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

export default EditorialPolicy;
