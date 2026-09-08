import { Helmet } from "react-helmet-async";
import { Users, AlertTriangle, Flag, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "28 August 2026";

const CommunityGuidelines = () => {
  return (
    <>
      <Helmet>
        <title>Community Guidelines | SkinLabs®</title>
        <meta name="description" content="Standards for respectful, useful and safe interaction on the SkinLabs Platform." />
        <link rel="canonical" href="https://skinlabs.co.za/community-guidelines" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Community Guidelines</h1>
                  <p className="text-xl text-muted-foreground">Effective date: {EFFECTIVE}</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Purpose</h2>
                  <p className="text-muted-foreground">
                    These Guidelines set the standards for interaction on the SkinLabs Platform — comments, forums, reviews, shared routines and any user-generated spaces. They keep the community respectful, useful and safe, and ensure discussions remain consistent with our educational, non-diagnostic mission.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">2. Core Expectations</h2>
                    </div>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li>Treat others with respect and courtesy, even when disagreeing</li>
                      <li>Share experiences and questions in good faith</li>
                      <li>Stay on topic and contribute constructively</li>
                      <li>Respect privacy — do not share others’ personal information without consent</li>
                      <li>Remember that SkinLabs content and SKYNN AI outputs are educational and cosmetic only, not medical advice</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">3. Prohibited Conduct</h2>
                    </div>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li>Post content that is unlawful, defamatory, harassing, hateful or discriminatory</li>
                      <li>Provide or solicit personalised medical diagnosis or treatment advice</li>
                      <li>Share graphic or non-consensual images in a way that shames or exploits individuals</li>
                      <li>Spam, advertise, or promote products without authorisation (including undisclosed affiliate promotion)</li>
                      <li>Impersonate others or misrepresent affiliation with SkinLabs or any brand</li>
                      <li>Attempt to manipulate scores, rankings or community features</li>
                      <li>Upload malware, scrape data, or interfere with the Platform</li>
                      <li>Post content that infringes intellectual-property or other third-party rights</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Medical & Safety Boundaries</h2>
                    <p className="text-muted-foreground">
                      The community is not a substitute for professional healthcare. Do not use the Platform to diagnose conditions or prescribe treatments. If you are experiencing a medical issue, consult an HPCSA-registered practitioner or seek emergency care. Posts that cross into personalised medical advice may be removed.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Flag className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">5. Reporting & Enforcement</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Moderators may remove content, issue warnings, restrict features, or suspend accounts that violate these Guidelines or our Terms. We aim to act proportionately. Report issues via in-Platform tools or email <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>.
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

export default CommunityGuidelines;
