import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
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
        <meta property="og:title" content="SA Skincare Product Reviews — Independent Scores | SkinLabs®" />
        <meta
          property="og:description"
          content="Independent skincare product reviews scored for South African conditions — efficacy, value, texture and climate fit. No paid placement."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4 mb-4">
            <AdSlot placement="reviews-top" compact />
          </div>
          <ReviewsGrid paginate />

          <div className="container mx-auto px-4 mt-14">
            <section className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">How SkinLabs reviews skincare products</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Every product on this page is scored the same way: full ingredient list analysis against the
                  evidence for what each active actually does at the concentration it's formulated at, then
                  real-world assessment of texture, absorption and how it behaves under South African heat, humidity
                  and sun exposure — conditions a lot of international reviews simply never test for. We score four
                  things independently — efficacy, value, texture and SA climate fit — and the product's overall
                  rating is the average, not a marketing-friendly round number.
                </p>
                <p>
                  We buy the products we review. Where a brand sends a sample instead, that's disclosed on the
                  review itself and it doesn't change the score — a gifted product held to a lower bar isn't a
                  review, it's an advertisement. There's no paid placement anywhere on this page: brands can't buy a
                  higher score, a better position in the grid or a more flattering write-up.
                </p>
                <p>
                  New reviews are added continuously as we work through the South African skincare shelf — from
                  budget pharmacy staples to clinic-exclusive actives — and every review links through to the{" "}
                  <Link to="/compare" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                    Shelf Showdowns
                  </Link>{" "}
                  and{" "}
                  <Link to="/briefings" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                    Daily Skinny briefings
                  </Link>{" "}
                  that reference the same ingredient evidence, so you can keep digging into the "why" behind any
                  score.
                </p>
              </div>
            </section>
          </div>

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
