import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsroomFeed from "@/components/NewsroomFeed";
import SeasonalsTeaser from "@/components/SeasonalsTeaser";
import Editorials from "@/components/Editorials";
import SpotlightTeaser from "@/components/SpotlightTeaser";
import AIFormulator from "@/components/AIFormulator";
import Features from "@/components/Features";
import Newsletter from "@/components/Newsletter";
import PodcastSection from "@/components/PodcastSection";
import Footer from "@/components/Footer";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";
import SEO from "@/components/SEO";
import { pageSeo, SITE_URL, BRAND } from "@/lib/seo-config";

const SectionDivider = () => (
  <div className="container mx-auto px-4" aria-hidden="true">
    <div className="border-t border-border/70" />
  </div>
);

const Index = () => {
  const seo = pageSeo.home;
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: SITE_URL,
    logo: `${SITE_URL}/pwa-512.png`,
    description: seo.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+27680200749",
      contactType: "customer service",
      areaServed: "ZA",
    },
    sameAs: [
      "https://instagram.com/skinlabsza",
      "https://facebook.com/skinlabs.co.za",
      "https://tiktok.com/@skinlabsza",
      "https://wa.me/27680200749",
      "https://whatsapp.com/channel/0029VbEAGud7oQhZSPGNPg3J",
    ],
  };

  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/reviews?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={`${SITE_URL}/`}
        ogImage={`${SITE_URL}/og-image.png`}
        jsonLd={[orgLd, webSiteLd]}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <NewsroomFeed limit={3} showExploreLink />
          <div className="container mx-auto px-4 py-8">
            <AdSlot placement="home-mid-1" compact />
          </div>
          <SectionDivider />
          <SeasonalsTeaser />
          <SectionDivider />
          <Editorials />
          <SectionDivider />
          <SpotlightTeaser />
          <div className="container mx-auto px-4 py-8">
            <AffiliateBanner placement="home-mid-2" />
          </div>
          <SectionDivider />
          <AIFormulator />
          <SectionDivider />
          <PodcastSection />
          <div className="container mx-auto px-4 py-8">
            <AdSlot placement="home-after-podcast" />
          </div>
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
