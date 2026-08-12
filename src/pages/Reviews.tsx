import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewsGrid from "@/components/ReviewsGrid";

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
