import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewsGrid from "@/components/ReviewsGrid";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";

const Reviews = () => {
  const { page } = useParams<{ page?: string }>();
  const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
  const canonical =
    pageNum <= 1 ? "https://skinlabs.co.za/reviews" : `https://skinlabs.co.za/reviews/page/${pageNum}`;

  return (
    <>
      <Helmet>
        <title>
          {pageNum > 1
            ? `SA Skincare Product Reviews — Page ${pageNum} | SkinLabs`
            : "SA Skincare Product Reviews — Independent Scores | SkinLabs"}
        </title>
        <meta
          name="description"
          content="Independent skincare product reviews scored for South African conditions — efficacy, value, texture and climate fit. No paid placement."
        />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4 mb-4">
            <AdSlot placement="reviews-top" compact />
          </div>
          <ReviewsGrid paginate />
          <div className="container mx-auto px-4 mt-8">
            <AffiliateBanner placement="reviews-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Reviews;
