import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Products from "@/components/Products";
import { Button } from "@/components/ui/button";

const ProductsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Products | SKINLABS</title>
        <meta
          name="description"
          content="Explore SKINLABS skincare devices, serums, and AI-backed formulations curated for radiant results."
        />
      </Helmet>
      <Header />
      <main className="pt-24">
        <Products />
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Need help choosing the right products?
                </h2>
                <p className="text-muted-foreground">
                  Get a personalized routine and shop products tailored to your skin goals.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/ai-formulator">Try AI Formulator</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://shop.skinlabs.co.za" target="_blank" rel="noopener noreferrer">
                    Visit Online Store
                  </a>
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

export default ProductsPage;
