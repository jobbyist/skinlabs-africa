import { Helmet } from "react-helmet-async";
import { Zap, Sun, Droplets, Wind } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

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
        <title>Skincare Devices - Professional Tools | SKINLABS</title>
        <meta
          name="description"
          content="Shop professional-grade skincare devices including LED therapy, microcurrent, cleansing tools, and steamers for salon-quality results at home."
        />
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
                    Professional-grade technology for salon-quality results at home
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {devices.map((device, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {device.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {device.name}
                      </h3>
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
                    Professional Results at Home
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    All our devices are FDA-approved and clinically tested to deliver professional-grade results in the comfort of your home
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">Certified</div>
                      <div className="text-sm text-muted-foreground">FDA Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">Tested</div>
                      <div className="text-sm text-muted-foreground">Clinically Proven</div>
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
