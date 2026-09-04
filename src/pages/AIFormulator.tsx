import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import AIFormulator from "@/components/AIFormulator";

const AIFormulatorPage = () => {
  return (
    <>
      <Helmet>
        <title>AI Formulator — A Routine Built Around Your Skin | SkinLabs</title>
        <meta
          name="description"
          content="Answer a few questions and get an AI-built AM/PM skincare routine, a progress tracker and dermatologist-reviewed product picks for your actual skin."
        />
        <link rel="canonical" href="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:title" content="AI Formulator — A Routine Built Around Your Skin | SkinLabs" />
        <meta
          property="og:description"
          content="Answer a few questions and get an AI-built routine, progress tracker and dermatologist-reviewed product picks."
        />
        <meta property="og:url" content="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SkinLabs AI Skincare Formulator",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "url": "https://skinlabs.co.za/ai-formulator",
          "description": "AI-built skincare routines, a progress tracker and dermatologist-reviewed product recommendations for South African skin.",
          "offers": { "@type": "Offer", "price": "99", "priceCurrency": "ZAR" }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <h1 className="sr-only">AI Formulator — A Skincare Routine Built Around Your Actual Skin</h1>
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
