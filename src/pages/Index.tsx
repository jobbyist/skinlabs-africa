import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsroomFeed from "@/components/NewsroomFeed";
import SeasonalsTeaser from "@/components/SeasonalsTeaser";
import Editorials from "@/components/Editorials";
import SpotlightTeaser from "@/components/SpotlightTeaser";
// Lazy: this below-the-fold widget alone pulls recharts (ConfidencePanel) and
// jspdf (generateSkincarePdf) into whatever bundles it — since Index.tsx is
// the one route App.tsx doesn't React.lazy(), an eager import here used to
// force ~360KB gzip of chart/PDF code to be modulepreloaded on every route
// sitewide, including static legal pages. The real /skynn-ai route already
// dynamically imports this same module, so the fetched chunk is shared.
const AIFormulator = lazyWithRetry(() => import("@/components/AIFormulator"));
import BrandAmbassadorTeaser from "@/components/BrandAmbassadorTeaser";
import Newsletter from "@/components/Newsletter";
import PodcastSection from "@/components/PodcastSection";
import Footer from "@/components/Footer";
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

          {/* Ad breaks: one unit per break, each separated by at least one full
              content section, none under the hero or after the SKYNN AI section. */}
          <NewsroomFeed limit={3} showExploreLink />
          <div className="container mx-auto px-4">
            <AdSlot placement="home-after-newsroom" compact />
          </div>

          <SeasonalsTeaser />
          <SectionDivider />

          <Editorials />
          <div className="container mx-auto px-4">
            <FaithfulToNature placement="home-after-editorials" />
          </div>

          <SpotlightTeaser />
          <SectionDivider />

          <Suspense
            fallback={
              <section className="py-20 bg-background">
                <div className="container mx-auto flex justify-center px-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Loading SKYNN AI skin analysis…</span>
                </div>
              </section>
            }
          >
            <AIFormulator />
          </Suspense>
          <SectionDivider />

          {/* Show 3 published podcast episodes */}
          <PodcastSection limit={3} />
          <div className="container mx-auto px-4">
            <AdSlot placement="home-after-podcast" />
          </div>

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
