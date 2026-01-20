import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About SKINLABS</title>
        <meta
          name="description"
          content="Learn about SKINLABS, our science-driven approach, and why we blend AI with dermatology."
        />
      </Helmet>
      <Header />
      <main className="pt-24">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
                About SKINLABS
              </p>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                Science-driven skincare built around you
              </h1>
              <p className="text-lg text-muted-foreground">
                We blend AI-powered analysis with dermatologist-approved science to create routines that
                fit your lifestyle, skin type, and goals. From clinically tested serums to next-gen devices,
                our mission is to make radiant skin achievable for everyone.
              </p>
            </div>
          </div>
        </section>
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
