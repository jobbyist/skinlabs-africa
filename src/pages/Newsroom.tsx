import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";

const Newsroom = () => {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const canonical = page > 1 ? `https://skinlabs.co.za/newsroom?page=${page}` : "https://skinlabs.co.za/newsroom";

  return (
    <>
      <Helmet>
        <title>
          {page > 1
            ? `The Daily Skinny — Page ${page} | SkinLabs`
            : "The Daily Skinny — Daily SA Skincare Briefings | SkinLabs"}
        </title>
        <meta
          name="description"
          content="A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. Available as premium PDF magazine for members."
        />
        <meta name="keywords" content="skincare news South Africa, daily skincare briefing, SA skincare science, skincare research, skincare education" />
        <link rel="canonical" href={canonical} />
        {page > 1 && (
          <link rel="prev" href={page === 2 ? "https://skinlabs.co.za/newsroom" : `https://skinlabs.co.za/newsroom?page=${page - 1}`} />
        )}
        <meta property="og:title" content="The Daily Skinny — Daily SA Skincare Briefings | SkinLabs" />
        <meta property="og:description" content="Daily brief of global skincare science for South African skin, climate and shelves." />
        <meta property="og:url" content="https://skinlabs.co.za/newsroom" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <AdSlot placement="newsroom-top" compact />
            <NewsroomFeed paginate />
            <AffiliateBanner placement="newsroom-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Newsroom;
