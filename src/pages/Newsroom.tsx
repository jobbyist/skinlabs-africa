import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";

const Newsroom = () => (
  <>
    <Helmet>
      <title>Skincare Newsroom — Daily SA Skin Science Briefings | SkinLabs</title>
      <meta
        name="description"
        content="A daily briefing of global skincare research and regulation, summarised and translated into what it means for South African skin, climate and products."
      />
      <link rel="canonical" href="https://skinlabs.co.za/newsroom" />
      <meta property="og:title" content="Skincare Newsroom — Daily SA Skin Science Briefings | SkinLabs" />
      <meta property="og:description" content="Daily skincare science, decoded for South African skin." />
      <meta property="og:url" content="https://skinlabs.co.za/newsroom" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>

    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <NewsroomFeed />
      </main>
      <Footer />
    </div>
  </>
);

export default Newsroom;
