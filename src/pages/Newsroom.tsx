import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";

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
    </Helmet>

    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <AdSlot placement="newsroom-top" compact />
          <NewsroomFeed />
          <AffiliateBanner placement="newsroom-bottom" />
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default Newsroom;
