import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";
import SEO from "@/components/SEO";
import { pageSeo, SITE_URL } from "@/lib/seo-config";

const Newsroom = () => {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const seo = pageSeo.briefings;
  const canonical = page > 1 ? `${SITE_URL}/briefings?page=${page}` : `${SITE_URL}/briefings`;
  const title = page > 1 ? `The Daily Skinny: Daily SA Skincare Briefings — Page ${page} | SkinLabs®` : seo.title;

  return (
    <>
      <SEO title={title} description={seo.description} keywords={seo.keywords} canonical={canonical} />
      {page > 1 && (
        <Helmet>
          <link rel="prev" href={page === 2 ? `${SITE_URL}/briefings` : `${SITE_URL}/briefings?page=${page - 1}`} />
        </Helmet>
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <AdSlot placement="briefings-top" compact />
            <NewsroomFeed paginate />
            <AffiliateBanner placement="briefings-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Newsroom;
