import { Helmet } from "react-helmet-async";
import { Truck, Package, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Shipping = () => {
  const shippingOptions = [
    {
      icon: <Truck className="h-8 w-8" />,
      name: "Standard Shipping",
      time: "3-5 Business Days",
      cost: "R60 (Free on orders over R500)",
      description: "Reliable delivery to your doorstep"
    },
    {
      icon: <Package className="h-8 w-8" />,
      name: "Express Shipping",
      time: "1-2 Business Days",
      cost: "R120",
      description: "Fast delivery for urgent orders"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Shipping Information - Delivery Details | SKINLABS</title>
        <meta
          name="description"
          content="Learn about SkinLabs shipping options, delivery times, and costs. Free shipping on orders over R500 across South Africa."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Shipping Information
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Fast, reliable delivery across South Africa
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  {shippingOptions.map((option, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                        {option.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-2">
                        {option.name}
                      </h3>
                      <div className="flex items-center gap-2 text-primary font-bold mb-2">
                        <Clock className="h-5 w-5" />
                        <span>{option.time}</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground mb-3">
                        {option.cost}
                      </p>
                      <p className="text-muted-foreground">{option.description}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Shipping Details</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Coverage Area
                      </h3>
                      <p className="text-muted-foreground">
                        We currently ship to all provinces in South Africa. International shipping is coming soon.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Processing Time
                      </h3>
                      <p className="text-muted-foreground">
                        Orders are processed within 1-2 business days. You'll receive a confirmation email once your order has been dispatched.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Tracking
                      </h3>
                      <p className="text-muted-foreground">
                        All orders include tracking. You'll receive a tracking number via email once your order ships. Track your package anytime on our Track Order page.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Delivery Times
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Delivery times are estimates and may vary based on location:
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                        <li>• Major cities: 2-3 business days</li>
                        <li>• Suburban areas: 3-4 business days</li>
                        <li>• Rural areas: 4-5 business days</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Shipping FAQs</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Do you offer free shipping?
                      </h3>
                      <p className="text-muted-foreground">
                        Yes! We offer free standard shipping on all orders over R500.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Can I change my shipping address?
                      </h3>
                      <p className="text-muted-foreground">
                        Yes, but only before your order has been dispatched. Contact us immediately at support@skinlabs.co.za if you need to update your address.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        What if my package is delayed?
                      </h3>
                      <p className="text-muted-foreground">
                        If your package hasn't arrived within the estimated delivery time, please contact our support team with your tracking number.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Need Help with Your Order?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Contact our support team for assistance with shipping questions
                  </p>
                  <a href="mailto:support@skinlabs.co.za" className="text-primary font-medium hover:underline">
                    support@skinlabs.co.za
                  </a>
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

export default Shipping;
