import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";

const Newsroom = () => (
  <>
    <Helmet>
      <title>The Daily Skinny — Daily SA Skincare Briefings | SkinLabs</title>
      <meta
        name="description"
        content="A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. Available as premium PDF magazine for members."
      />
      <meta name="keywords" content="skincare news South Africa, daily skincare briefing, SA skincare science, skincare research, skincare education" />
      <link rel="canonical" href="https://skinlabs.co.za/newsroom" />
      <meta property="og:title" content="The Daily Skinny — Daily SA Skincare Briefings | SkinLabs" />
      <meta property="og:description" content="Daily brief of global skincare science for South African skin, climate and shelves." />
      <meta property="og:url" content="https://skinlabs.co.za/newsroom" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        "name": "The Daily Skinny by SkinLabs",
        "url": "https://skinlabs.co.za/newsroom",
        "logo": "https://skinlabs.co.za/pwa-512.png",
        "description": "Daily briefings of global skincare science translated for South African skin, climate and shelves.",
        "sameAs": ["https://wa.me/27680200749"],
        "publishingPrinciples": "https://skinlabs.co.za/about"
      })}</script>
    </Helmet>

    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <h1 className="sr-only">The Daily Skinny — Daily SA Skincare Briefings</h1>
        <NewsroomFeed searchable />
      </main>
      <Footer />
    </div>
  </>
);

export default Newsroom;
