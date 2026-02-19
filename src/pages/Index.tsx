import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import EdibleSkincare from "@/components/EdibleSkincare";
import AIFormulator from "@/components/AIFormulator";
import Features from "@/components/Features";
import Newsletter from "@/components/Newsletter";
import PodcastSection from "@/components/PodcastSection";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SKINLABS - AI-Powered Skincare Technology | Custom Formulations</title>
        <meta name="description" content="Discover next generation skincare with SKINLABS. AI-powered custom formulations and premium imported skincare technology devices for radiant, healthy skin." />
        <meta name="keywords" content="skincare, AI skincare, custom formulations, skincare technology, LED mask, microcurrent, serums" />
        <link rel="canonical" href="https://skinlabs.co.za" />
        <meta property="og:title" content="SKINLABS - AI-Powered Skincare Technology" />
        <meta property="og:description" content="Discover next generation skincare with SKINLABS. AI-powered custom formulations and premium imported skincare technology devices." />
        <meta property="og:url" content="https://skinlabs.co.za" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SKINLABS - AI-Powered Skincare Technology" />
        <meta name="twitter:description" content="Discover next generation skincare with SKINLABS. AI-powered custom formulations and premium imported skincare technology devices." />
        <meta name="twitter:image" content="https://skinlabs.co.za/pwa-512.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SkinLabs",
          "url": "https://skinlabs.co.za",
          "logo": "https://skinlabs.co.za/pwa-512.png",
          "description": "AI-powered skincare technology and custom formulations.",
          "contactPoint": { "@type": "ContactPoint", "telephone": "+27128806560", "contactType": "customer service" },
          "sameAs": ["https://wa.me/27680200749"]
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <Products />
          <EdibleSkincare />
          <AIFormulator />
          <Features />
          <Newsletter />
          <PodcastSection />
        </main>
        <Footer />
        <CookieConsent />
      </div>
    </>
  );
};

export default Index;
