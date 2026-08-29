import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewsGrid from "@/components/ReviewsGrid";
import AffiliateBanner from "@/components/AffiliateBanner";

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
          content="Independent reviews of South African skincare brands, scored on efficacy, value, texture and performance in local climate conditions. Rand pricing and where to buy."
        />
        <link rel="canonical" href={canonical} />
        {pageNum > 1 && (
          <link
            rel="prev"
            href={pageNum === 2 ? "https://skinlabs.co.za/reviews" : `https://skinlabs.co.za/reviews/page/${pageNum - 1}`}
          />
        )}
        <link rel="next" href={`https://skinlabs.co.za/reviews/page/${pageNum + 1}`} />
        <meta property="og:title" content="SA Skincare Product Reviews — Independent Scores | SkinLabs" />
        <meta property="og:description" content="Locally focused skincare reviews with rand pricing and climate performance scores." />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <h1 className="sr-only">SA Skincare Product Reviews</h1>
          <div className="container mx-auto px-4 pt-6 pb-2">
            <AffiliateBanner placement="reviews-top" compact />
          </div>
          <ReviewsGrid paginate />
          <div className="container mx-auto px-4 py-10">
            <AffiliateBanner placement="reviews-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Reviews;
