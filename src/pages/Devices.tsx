import { Helmet } from "react-helmet-async";
import { Zap, Sun, Droplets, Wind } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import AdSlot from "@/components/AdSlot";

const Devices = () => {
  const devices = [
    {
      icon: <Sun className="h-8 w-8" />,
      name: "LED Light Therapy Mask",
      description: "Professional-grade red and blue light therapy for anti-aging and acne treatment",
      price: "R 2,499",
      features: ["7 LED wavelengths", "10-minute sessions", "Clinical results"]
    },
    {
      icon: <Zap className="h-8 w-8" />,
      name: "Microcurrent Device",
      description: "Facial toning and lifting device for instant and long-term results",
      price: "R 3,299",
      features: ["Instant lift", "Non-invasive", "FDA-approved"]
    },
    {
      icon: <Droplets className="h-8 w-8" />,
      name: "Ultrasonic Cleansing Brush",
      description: "Deep pore cleansing with gentle ultrasonic vibrations",
      price: "R 1,299",
      features: ["Waterproof", "3 speed settings", "USB rechargeable"]
    },
    {
      icon: <Wind className="h-8 w-8" />,
      name: "Nano Ionic Steamer",
      description: "Professional facial steamer for deep hydration and product absorption",
      price: "R 899",
      features: ["Nano steam", "Auto shut-off", "Spa quality"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Skincare Devices — LED, Microcurrent & Cleansing Tools | SKINLABS</title>
        <meta
          name="description"
          content="LED masks, microcurrent, ultrasonic cleansing brushes and facial steamers, with rand pricing and what each device actually does for your skin."
        />
        <link rel="canonical" href="https://skinlabs.co.za/devices" />
        <meta property="og:title" content="Skincare Devices | SKINLABS" />
        <meta property="og:description" content="LED masks, microcurrent, cleansing tools and steamers, with honest notes on what each one does." />
        <meta property="og:url" content="https://skinlabs.co.za/devices" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Skincare Devices
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Salon-style tools for home use — here's what each one actually does
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="mb-8">
                  <AdSlot placement="devices-mid" />
                </div>

                  {devices.map((device, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {device.icon}
                      </div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">
                        {device.name}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {device.description}
                      </p>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {device.price}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {device.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full">Add to Cart</Button>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    What "professional-grade" actually means here
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Every device we carry is FDA-approved and has been through clinical testing. That doesn't mean
                    overnight transformation — consistent use over several weeks is what gets you the results.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">Certified</div>
                      <div className="text-sm text-muted-foreground">FDA Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">Studied</div>
                      <div className="text-sm text-muted-foreground">In Clinical Trials</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">Warranty</div>
                      <div className="text-sm text-muted-foreground">2 Years</div>
                    </div>
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

export default Devices;
