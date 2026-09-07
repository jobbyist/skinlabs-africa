import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import AIFormulator from "@/components/AIFormulator";

const AIFormulatorPage = () => {
  return (
    <>
      <Helmet>
        <title>SKYNN AI (beta) — Skin Assessment &amp; Routine Formulator | SkinLabs</title>
        <meta
          name="description"
          content="SKYNN AI (beta): an AI-powered skin assessment with Monk Skin Tone (MST) fairness testing, an AM/PM routine and product picks grounded in SkinLabs' own reviewed catalogue — free starter analysis, no card required."
        />
        <link rel="canonical" href="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:title" content="SKYNN AI (beta) — Skin Assessment & Routine Formulator | SkinLabs" />
        <meta
          property="og:description"
          content="An AI-powered skin assessment built for every skin tone — MST fairness testing, AM/PM routine and product picks grounded in real SkinLabs reviews."
        />
        <meta property="og:url" content="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SKYNN AI (beta) by SkinLabs",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "url": "https://skinlabs.co.za/ai-formulator",
          "description": "AI-powered skin assessment and routine formulator with Monk Skin Tone fairness testing, built for every skin tone, grounded in SkinLabs' reviewed product catalogue.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ZAR", "description": "Free Starter Analysis" }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <h1 className="sr-only">SKYNN AI (beta) — A Skincare Assessment Built for Every Skin Tone</h1>
          <div className="container mx-auto px-4 py-6">
            <AdSlot placement="ai-formulator-top" compact />
          </div>
          <AIFormulator />
          <div className="container mx-auto px-4 py-8">
            <AdSlot placement="ai-formulator-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AIFormulatorPage;
