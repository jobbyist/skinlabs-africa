import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PodcastSection from "@/components/PodcastSection";

const PodcastPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>The Skin Deep Podcast | Skinlabs</title>
        <meta
          name="description"
          content="Stream the Skin Deep Podcast for expert skincare conversations, product science breakdowns, and mindful beauty routines."
        />
        <link rel="canonical" href="https://skinlabs.com/stream" />
      </Helmet>
      <Header />
      <main className="pt-20">
        <PodcastSection
          heading="The Skin Deep Podcast"
          description="Stream the full Skin Deep Podcast library and explore the skincare conversations shaping modern routines. Each episode includes a narrated preview and SEO-friendly summary."
          showCta={false}
        />
      </main>
      <Footer />
    </div>
  );
};

export default PodcastPage;
