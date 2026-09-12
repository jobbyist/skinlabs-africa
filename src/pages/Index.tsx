import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsroomFeed from "@/components/NewsroomFeed";
import SeasonalsTeaser from "@/components/SeasonalsTeaser";
import Editorials from "@/components/Editorials";
import SpotlightTeaser from "@/components/SpotlightTeaser";
import AIFormulator from "@/components/AIFormulator";
import BrandAmbassadorTeaser from "@/components/BrandAmbassadorTeaser";
import Newsletter from "@/components/Newsletter";
import PodcastSection from "@/components/PodcastSection";
import Footer from "@/components/Footer";
import AffiliateBanner from "@/components/AffiliateBanner";
import FaithfulToNature from "@/components/FaithfulToNature";
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

          {/* Faithful to Nature affiliate banner directly below hero */}
          <div className="container mx-auto px-4 py-8">
            <FaithfulToNature placement="home-below-hero" />
          </div>

          <NewsroomFeed limit={3} showExploreLink />
          <div className="container mx-auto px-4 py-6">
            <AdSlot placement="home-after-newsroom" compact />
          </div>
          <SectionDivider />

          <SeasonalsTeaser />
          <div className="container mx-auto px-4 py-6">
            <AdSlot placement="home-after-seasonals" compact />
          </div>
          <SectionDivider />

          <Editorials />
          <div className="container mx-auto px-4 py-6">
            <AdSlot placement="home-after-editorials" compact />
          </div>
          <SectionDivider />

          <SpotlightTeaser />
          <div className="container mx-auto px-4 py-8">
            <AffiliateBanner placement="home-mid-2" />
          </div>
          <SectionDivider />

          <AIFormulator />
          <div className="container mx-auto px-4 py-6">
            <AdSlot placement="home-after-aiformulator" compact />
          </div>
          <SectionDivider />

          {/* Show 3 published podcast episodes */}
          <PodcastSection limit={3} />
          <div className="container mx-auto px-4 py-8">
            <AdSlot placement="home-after-podcast" />
          </div>
          <SectionDivider />

          {/* Brand Ambassador Programme 2026 announcement (replaces The Short Version / Features) */}
          <BrandAmbassadorTeaser />
          <SectionDivider />

          <Newsletter />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
