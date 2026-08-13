import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIFormulator from "@/components/AIFormulator";

const AIFormulatorPage = () => {
  return (
    <>
      <Helmet>
        <title>AI Formulator — Premium Personalized Skincare | SKINLABS</title>
        <meta
          name="description"
          content="Premium AI-powered service: Get personalized skincare routines, progress trackers and dermatologist-approved product recommendations tailored to your unique skin profile."
        />
        <link rel="canonical" href="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:title" content="AI Formulator — Premium Personalized Skincare | SKINLABS" />
        <meta
          property="og:description"
          content="Premium service: Get personalized routines, trackers and dermatologist-approved recommendations for your unique skin profile."
        />
        <meta property="og:url" content="https://skinlabs.co.za/ai-formulator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SKINLABS AI Skincare Formulator",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "url": "https://skinlabs.co.za/ai-formulator",
          "description": "Personalized AI-generated skincare routines grounded in dermatology literature, with downloadable PDF reports.",
          "description": "Premium AI-powered service for personalized skincare routines, trackers and dermatologist-approved product recommendations.",
          "offers": { "@type": "Offer", "price": "99", "priceCurrency": "ZAR" }
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <AIFormulator />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AIFormulatorPage;
