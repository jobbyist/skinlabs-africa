import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewsGrid from "@/components/ReviewsGrid";
import { productReviews } from "@/data/reviews";

const reviewsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SkinLabs Independent Skincare Reviews",
  itemListElement: productReviews.map((review, index) => {
    const avgScore =
      (review.score_efficacy + review.score_value + review.score_texture + review.score_climate) / 4;
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: review.product_name,
        brand: { "@type": "Brand", name: review.brand },
        category: review.category,
        review: {
          "@type": "Review",
          reviewBody: review.verdict,
          author: { "@type": "Organization", name: "SkinLabs" },
          reviewRating: {
            "@type": "Rating",
            ratingValue: avgScore.toFixed(1),
            bestRating: "10",
            worstRating: "0",
          },
        },
        offers: {
          "@type": "Offer",
          price: review.local_price_zar,
          priceCurrency: "ZAR",
          availability: review.retailers.some((r) => r.in_stock)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      },
    };
  }),
};

const Reviews = () => (
  <>
    <Helmet>
      <title>SA Skincare Product Reviews — Independent Scores | SkinLabs</title>
      <meta
        name="description"
        content="Independent reviews of South African skincare brands, scored on efficacy, value, texture and performance in local climate conditions. Rand pricing and where to buy."
      />
      <link rel="canonical" href="https://skinlabs.co.za/reviews" />
      <meta property="og:title" content="SA Skincare Product Reviews — Independent Scores | SkinLabs" />
      <meta property="og:description" content="Locally focused skincare reviews with rand pricing and climate performance scores." />
      <meta property="og:url" content="https://skinlabs.co.za/reviews" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify(reviewsJsonLd)}</script>
    </Helmet>

    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <ReviewsGrid />
      </main>
      <Footer />
    </div>
  </>
);

export default Reviews;
