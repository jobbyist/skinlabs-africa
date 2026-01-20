import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EdibleSkincare from "@/components/EdibleSkincare";
import { Button } from "@/components/ui/button";

const EdibleSkincarePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Edible Skincare | SKINLABS</title>
        <meta
          name="description"
          content="Discover SKINLABS edible skincare pouches, created with organic ingredients for glow-from-within support."
        />
      </Helmet>
      <Header />
      <main className="pt-24">
        <EdibleSkincare />
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Ready to reserve your pouch?
                </h2>
                <p className="text-muted-foreground">
                  Join the early access list and be the first to know when pre-orders open.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/contact">Join the waitlist</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/products">Browse all products</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EdibleSkincarePage;
