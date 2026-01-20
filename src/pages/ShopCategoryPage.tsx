import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const shopCategories = {
  "all-products": {
    title: "All Products",
    description: "Browse our full catalog of AI-powered skincare devices, serums, and formulations.",
  },
  devices: {
    title: "Devices",
    description: "Shop next-generation skincare devices designed for professional results at home.",
  },
  serums: {
    title: "Serums",
    description: "Explore clinically tested serums tailored for every skin concern.",
  },
  "custom-formulas": {
    title: "Custom Formulas",
    description: "Discover AI-personalized formulations created for your unique skin profile.",
  },
  "gift-sets": {
    title: "Gift Sets",
    description: "Curated bundles designed to make gifting skincare effortless.",
  },
};

const ShopCategoryPage = () => {
  const { category } = useParams();
  const selected = category ? shopCategories[category as keyof typeof shopCategories] : null;

  if (!selected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Category not found</h1>
            <p className="text-muted-foreground mb-6">
              We could not find that category. Explore our full catalog instead.
            </p>
            <Button asChild>
              <Link to="/products">View all products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{selected.title} | SKINLABS</title>
        <meta name="description" content={selected.description} />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Shop</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {selected.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{selected.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/products">Browse curated picks</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://shop.skinlabs.co.za" target="_blank" rel="noopener noreferrer">
                  Visit online store
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ShopCategoryPage;
