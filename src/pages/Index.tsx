import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsroomFeed from "@/components/NewsroomFeed";
import SeasonalsTeaser from "@/components/SeasonalsTeaser";
import Editorials from "@/components/Editorials";
import SpotlightTeaser from "@/components/SpotlightTeaser";
import ReviewsGrid from "@/components/ReviewsGrid";
import AIFormulator from "@/components/AIFormulator";
import Features from "@/components/Features";
import Newsletter from "@/components/Newsletter";
import PodcastSection from "@/components/PodcastSection";
import Footer from "@/components/Footer";

/** Subtle section divider used between homepage blocks */
const SectionDivider = () => (
  <div className="container mx-auto px-4" aria-hidden="true">
    <div className="border-t border-border/70" />
  </div>
);

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SkinLabs — AI Skincare Routines & SA Skin Science Platform</title>
        <meta name="description" content="South Africa's AI-powered skincare platform: personalised routines, daily skin science briefings, independent local product reviews and virtual derm consultations." />
        <meta name="keywords" content="skincare South Africa, AI skincare routine, skincare news, SA product reviews, virtual dermatologist" />
        <link rel="canonical" href="https://skinlabs.co.za" />
        <meta property="og:title" content="SkinLabs — AI Skincare Routines & SA Skin Science Platform" />
        <meta property="og:description" content="Personalised AI routines, daily skincare news and independent SA product reviews." />
        <meta property="og:url" content="https://skinlabs.co.za" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SkinLabs — AI Skincare Routines & SA Skin Science Platform" />
        <meta name="twitter:description" content="Personalised AI routines, daily skincare news and independent SA product reviews." />
        <meta name="twitter:image" content="https://skinlabs.co.za/pwa-512.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SkinLabs",
          "url": "https://skinlabs.co.za",
          "logo": "https://skinlabs.co.za/pwa-512.png",
          "description": "AI-powered skincare intelligence, news and reviews for South Africa.",
          "contactPoint": { "@type": "ContactPoint", "telephone": "+27128806560", "contactType": "customer service" },
          "sameAs": ["https://wa.me/27680200749"]
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <SectionDivider />
          <NewsroomFeed limit={3} showExploreLink />
          <SectionDivider />
          <SeasonalsTeaser />
          <SectionDivider />
          <Editorials />
          <SectionDivider />
          <SpotlightTeaser />
          <SectionDivider />
          <AIFormulator />
          <SectionDivider />
          <PodcastSection />
          <SectionDivider />
          <Features />
          <SectionDivider />
          <Newsletter />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
