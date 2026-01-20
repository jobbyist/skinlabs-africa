import { Helmet } from "react-helmet-async";
import { Package, Search, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const TrackOrder = () => {
  return (
    <>
      <Helmet>
        <title>Track Order - Find Your Package | SKINLABS</title>
        <meta
          name="description"
          content="Track your SkinLabs order in real-time. Enter your order number to see the current status and estimated delivery date."
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
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Track Your Order
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Enter your order details to see real-time tracking information
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Find Your Order
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Order Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., SL-123456"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-12 gap-2">
                    <Search className="h-5 w-5" />
                    Track Order
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    You can find your order number in your confirmation email
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Order Status Guide</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Processing</h3>
                        <p className="text-sm text-muted-foreground">
                          Your order has been received and is being prepared for shipment
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Shipped</h3>
                        <p className="text-sm text-muted-foreground">
                          Your order has been dispatched and is on its way to you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Out for Delivery</h3>
                        <p className="text-sm text-muted-foreground">
                          Your package is with the courier and will arrive today
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Delivered</h3>
                        <p className="text-sm text-muted-foreground">
                          Your order has been successfully delivered
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Haven't received tracking?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Tracking information is typically sent within 24-48 hours of placing your order.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Tracking not updating?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Tracking can take 24 hours to update. Contact us if it's been longer.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Need Help?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Contact our support team if you have questions about your order
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a href="mailto:support@skinlabs.co.za" className="text-primary font-medium hover:underline">
                      support@skinlabs.co.za
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="tel:+27128806560" className="text-primary font-medium hover:underline">
                      +27 12 880 6560
                    </a>
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

export default TrackOrder;
