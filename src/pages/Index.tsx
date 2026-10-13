import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsroomFeed from "@/components/NewsroomFeed";
import Editorials from "@/components/Editorials";
import BrandAmbassadorTeaser from "@/components/BrandAmbassadorTeaser";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import SkyNNLaunchpadCard from "@/components/SkyNNLaunchpadCard";
import FaithfulToNature from "@/components/FaithfulToNature";
import AdSlot from "@/components/AdSlot";
import SEO from "@/components/SEO";
import { Suspense } from "react";
import { useTheme } from "next-themes";
import { pageSeo, SITE_URL, BRAND, buildOrganizationJsonLd } from "@/lib/seo-config";
import AdSlotAutorelaxed from "@/components/AdSlotAutorelaxed";
import { lazyWithRetry } from "@/lib/chunkRecovery";

// Lazy: the notch pulls in react-query + the weather call, none of which the first paint needs.
// Below-the-fold sections that carry catalogue data (reviews, podcast, spotlight, seasons). They are their own chunks,
// requested the moment the page mounts (not on scroll, so prerendered HTML and crawlers still get them), and the entry
// bundle no longer ships ~400 kB of content data. Each placeholder reserves the section's height so nothing shifts.
const SeasonalsTeaser = lazyWithRetry(() => import("@/components/SeasonalsTeaser"));
const SpotlightTeaser = lazyWithRetry(() => import("@/components/SpotlightTeaser"));
const LatestReviews = lazyWithRetry(() => import("@/components/LatestReviews"));
const PodcastSection = lazyWithRetry(() => import("@/components/PodcastSection"));
const Reserve = ({ h }: { h: number }) => <div aria-hidden="true" style={{ minHeight: h }} />;

const SkinWeatherNotch = lazyWithRetry(() => import("@/components/SkinWeatherNotch"));

const SectionDivider = () => (
  <div className="container mx-auto px-4" aria-hidden="true">
    <div className="border-t border-border/70" />
  </div>
);

const Index = () => {
  const seo = pageSeo.home;
  const { resolvedTheme } = useTheme();
  const orgLd = buildOrganizationJsonLd(resolvedTheme);

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
            <AdSlot placement="home-after-newsroom" compact priority="primary" />
          </div>

          <Suspense fallback={<Reserve h={520} />}>
            <SeasonalsTeaser />
          </Suspense>

          {/* Latest 3 product reviews sit directly above the Comparisons (Shelf Showdown) section. */}
          <Suspense fallback={<Reserve h={620} />}>
            <LatestReviews />
          </Suspense>

          <Editorials />
          <div className="container mx-auto px-4">
            <FaithfulToNature placement="home-after-editorials" />
          </div>

          <Suspense fallback={<Reserve h={560} />}>
            <SpotlightTeaser />
          </Suspense>

          {/* The full SKYNN AI questionnaire lives on /skynn-ai; the homepage only
              exposes a lightweight launchpad so the heavy analysis dependencies
              are not requested on initial homepage render. */}
          <SkyNNLaunchpadCard />

          {/* Show 3 published podcast episodes */}
          <Suspense fallback={<Reserve h={560} />}>
            <PodcastSection limit={3} />
          </Suspense>
          <div className="container mx-auto px-4">
            <AdSlot placement="home-after-podcast" />
          </div>

          {/* Brand Ambassador Programme 2026 announcement (replaces The Short Version / Features) */}
          <BrandAmbassadorTeaser />
          <div className="container mx-auto px-4">
            <AdSlotAutorelaxed placement="home-before-newsletter" compact />
          </div>

          <Newsletter />
        </main>
        <Footer />
        {/* Homepage only: local SA intelligence (UV, humidity, Highveld vs coastal) in seconds. */}
        <Suspense fallback={null}>
          <SkinWeatherNotch />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
