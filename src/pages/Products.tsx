import { Helmet } from "react-helmet-async";
import { Sparkles, Droplet, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Products = () => {
  const categories = [
    {
      icon: <Droplet className="h-8 w-8" />,
      title: "Serums & Treatments",
      description: "Targeted solutions for your specific skin concerns",
      products: ["Vitamin C Serum", "Hyaluronic Acid", "Retinol Treatment"]
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Devices",
      description: "Advanced technology for professional results at home",
      products: ["LED Light Therapy", "Microcurrent Device", "Cleansing Brush"]
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Custom Formulas",
      description: "Personalized skincare created just for you",
      products: ["Custom Moisturizer", "Bespoke Serum", "Tailored Cleanser"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Products - Premium Skincare | SKINLABS</title>
        <meta name="description" content="Discover our range of science-backed skincare products including serums, devices, and custom formulas tailored to your skin's needs." />
        <link rel="canonical" href="https://skinlabs.co.za/products" />
        <meta property="og:title" content="Premium Skincare Products | SKINLABS" />
        <meta property="og:description" content="Science-backed skincare products including serums, devices, and custom formulas." />
        <meta property="og:url" content="https://skinlabs.co.za/products" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "SkinLabs Products",
          url: "https://skinlabs.co.za/products",
          description: "Science-backed skincare categories: serums & treatments, devices, and custom formulas.",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: categories.map((category, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: category.title,
              description: category.description,
            })),
          },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Our Products
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Science-backed skincare solutions designed to deliver real results
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  {categories.map((category, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {category.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {category.title}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {category.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {category.products.map((product, idx) => (
                          <li key={idx} className="text-sm text-foreground">• {product}</li>
                        ))}
                      </ul>
                      <Button className="w-full">Shop Now</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Not sure what's right for you?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Try our AI-powered formulator to get personalized product recommendations based on your unique skin profile
                  </p>
                  <Button size="lg" className="gap-2" asChild>
                    <a href="/ai-formulator">
                      <Sparkles className="h-5 w-5" />
                      Try AI Formulator
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Products;
