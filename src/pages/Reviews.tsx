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
        <main className="pt-24 pb-24">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Reviews</p>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                Independent SA product scores
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Every score is published, evidence-led and free of paid placement. Built for South African shelves and climate.
              </p>
            </div>
            <AdSlot placement="reviews-top" compact />
            <div className="mt-8">
              <ReviewsGrid page={pageNum} />
            </div>
            <AffiliateBanner placement="reviews-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Reviews;
