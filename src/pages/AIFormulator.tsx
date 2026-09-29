import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import AIFormulator from "@/components/AIFormulator";
import { DEFAULT_OG, SITE_URL, pageSeo } from "@/lib/seo-config";
import { BASIC_NAME, SKYNN_RELEASE_LABEL } from "@/lib/skynn/terminology";

// Title/description come from seo-config's `skynnAi` entry — the same one
// SitewideSEO uses — so the two can never disagree again.
const seo = pageSeo.skynnAi;
const canonical = `${SITE_URL}${seo.canonicalPath}`;

const AIFormulatorPage = () => {
  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={DEFAULT_OG} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": `${SKYNN_RELEASE_LABEL} by SkinLabs`,
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "url": canonical,
          "description": seo.description,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ZAR", "description": BASIC_NAME }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <h1 className="sr-only">{SKYNN_RELEASE_LABEL} — {BASIC_NAME}, built for every skin tone</h1>
          <AIFormulator />
          <div className="container mx-auto px-4">
            <AdSlot placement="ai-formulator-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AIFormulatorPage;
