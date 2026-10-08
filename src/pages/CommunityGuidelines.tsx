import { Helmet } from "react-helmet-async";
import { Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuidelinesContent, { GUIDELINES_EFFECTIVE } from "@/components/community/GuidelinesContent";

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
                  <p className="text-xl text-muted-foreground">Effective date: {GUIDELINES_EFFECTIVE}</p>
                </div>

                <GuidelinesContent />
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
