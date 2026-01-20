import { Helmet } from "react-helmet-async";
import { Gift, Heart, Sparkles, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const GiftSets = () => {
  const giftSets = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      name: "The Essentials Set",
      description: "Complete daily routine with cleanser, serum, and moisturizer",
      price: "R 1,499",
      includes: ["Gentle Cleanser", "Hyaluronic Serum", "Daily Moisturizer", "Gift Box"]
    },
    {
      icon: <Star className="h-8 w-8" />,
      name: "The Glow Set",
      description: "Brightening and radiance-boosting collection",
      price: "R 1,899",
      includes: ["Vitamin C Serum", "Brightening Mask", "Glow Moisturizer", "Luxury Packaging"]
    },
    {
      icon: <Heart className="h-8 w-8" />,
      name: "The Anti-Aging Set",
      description: "Advanced formulas for youthful, firm skin",
      price: "R 2,299",
      includes: ["Retinol Serum", "Peptide Cream", "Eye Treatment", "Premium Gift Box"]
    },
    {
      icon: <Gift className="h-8 w-8" />,
      name: "The Discovery Set",
      description: "Try our bestsellers in travel-friendly sizes",
      price: "R 799",
      includes: ["5 Travel Minis", "Skincare Guide", "Sample Voucher", "Gift Bag"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Gift Sets - Perfect Skincare Gifts | SKINLABS</title>
        <meta
          name="description"
          content="Shop curated skincare gift sets perfect for any occasion. Beautifully packaged collections of our best products with special gift packaging."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Gift Sets
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Thoughtfully curated collections perfect for gifting or treating yourself
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {giftSets.map((set, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {set.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {set.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {set.description}
                      </p>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {set.price}
                      </div>
                      <div className="mb-6">
                        <div className="text-sm font-semibold text-foreground mb-2">Set Includes:</div>
                        <ul className="space-y-2">
                          {set.includes.map((item, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full">Add to Cart</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Why Choose Our Gift Sets?
                  </h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                        🎁
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Premium Packaging</h3>
                      <p className="text-sm text-muted-foreground">
                        Beautifully presented in luxe gift boxes ready to impress
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                        💰
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Great Value</h3>
                      <p className="text-sm text-muted-foreground">
                        Save up to 25% compared to buying products individually
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                        ✨
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Curated Selection</h3>
                      <p className="text-sm text-muted-foreground">
                        Expert-selected products that work perfectly together
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Perfect for Any Occasion
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Birthdays, anniversaries, holidays, or just because - our gift sets make every moment special
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <span className="px-4 py-2 bg-background rounded-full text-sm font-medium">Free Gift Card</span>
                    <span className="px-4 py-2 bg-background rounded-full text-sm font-medium">Free Shipping</span>
                    <span className="px-4 py-2 bg-background rounded-full text-sm font-medium">Gift Wrapping</span>
                  </div>
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

export default GiftSets;
