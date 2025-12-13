import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import EdibleSkincare from "@/components/EdibleSkincare";
import AIFormulator from "@/components/AIFormulator";
import Features from "@/components/Features";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SKINLABS - AI-Powered Skincare Technology | Custom Formulations</title>
        <meta
          name="description"
          content="Discover next generation skincare with SKINLABS. AI-powered custom formulations and premium imported skincare technology devices for radiant, healthy skin."
        />
        <meta name="keywords" content="skincare, AI skincare, custom formulations, skincare technology, LED mask, microcurrent, serums" />
        <link rel="canonical" href="https://skinlabs.com" />
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
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
