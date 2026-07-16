import { Sparkles, ShoppingCart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AudioNarrationPlayer from "@/components/AudioNarrationPlayer";
import edibleSkincareImage from "@/assets/edible-skincare-pouches.png";

const EdibleSkincare = () => {
  const flavors = [
    {
      name: "Bubblegum Pop",
      description: "Sweet and playful with natural fruit extracts",
    },
    {
      name: "Creamy Cheesecake",
      description: "Rich and indulgent with nourishing ingredients",
    },
    {
      name: "Blueberry Dreams",
      description: "Antioxidant-rich with a delightful berry blend",
    },
  ];

  const retailers = ["Takealot", "Amazon", "Other Retail Outlets"];
  const edibleNarration =
    "Skinlabs edible skincare pouches are designed for glow-from-within rituals. Each pouch blends organic botanicals, skin-supporting vitamins, and hydration boosters to help calm breakouts, strengthen the skin barrier, and support radiant texture. Expect delicious flavors, sugar-conscious formulas, and clinically guided routines created by the Skinlabs team. Pre-orders open soon, and early access members will receive launch bundles and guided plans tailored to their skin goals.";

  return (
    <section id="edible-skincare" className="py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">First in African Skincare Industry</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Edible Skincare Pouches
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Introducing our revolutionary range of 100% organically formulated and naturally sourced edible skincare pouches. 
              A groundbreaking innovation in the African skincare industry.
            </p>

            {/* Flavors */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Available in 3 Delicious Flavors:</h3>
              <div className="space-y-3">
                {flavors.map((flavor) => (
                  <div key={flavor.name} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="font-semibold text-foreground">{flavor.name}</p>
                      <p className="text-sm text-muted-foreground">{flavor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Limited Time Notice */}
            <div className="bg-accent/50 border border-border rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">Limited Time Pre-Order</p>
                  <p className="text-sm text-muted-foreground">
                    Available now for exclusive pre-order on our online store
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon to Retailers */}
            <div className="mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-2">Coming Soon To:</p>
              <div className="flex flex-wrap gap-3">
                {retailers.map((retailer) => (
                  <span
                    key={retailer}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium"
                  >
                    {retailer}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/edible-pouches">
                  <ShoppingCart className="h-5 w-5" />
                  Pre-Order Now
                </Link>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edible Skincare Pouches Preview</DialogTitle>
                    <DialogDescription>
                      Listen to the narrated breakdown and review the highlights below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <AudioNarrationPlayer
                      label="Audio overview"
                      audioSrc="/pouches.m4a"
                      text={edibleNarration}
                      supportingText="Press play to listen to the audio overview."
                    />
                    <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-2">What to expect</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Organic botanical blends crafted for daily skin support.</li>
                        <li>Glow-focused nutrients like vitamin C, zinc, and collagen allies.</li>
                        <li>Flavor-forward pouches designed for consistent routines.</li>
                        <li>Early access bundles and guided usage plans.</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
              <img
                src={edibleSkincareImage}
                alt="Edible Skincare Pouches in three flavors"
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EdibleSkincare;
