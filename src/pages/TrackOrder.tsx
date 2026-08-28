import { Helmet } from "react-helmet-async";
import { Package, Search, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const TrackOrder = () => {
  return (
    <>
      <Helmet>
        <title>Track Your Order | SKINLABS</title>
        <meta
          name="description"
          content="Enter your order number and email to see where your SkinLabs package actually is, plus what each delivery status means."
        />
        <link rel="canonical" href="https://skinlabs.co.za/track-order" />
        <meta property="og:title" content="Track Your Order | SKINLABS" />
        <meta property="og:description" content="Enter your order number to check delivery status in real time." />
        <meta property="og:url" content="https://skinlabs.co.za/track-order" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
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
                    Enter your details below and we'll show you exactly where your order is
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Find your order
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
                    Your order number is in your confirmation email — check spam if you can't find it
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">What each status means</h2>
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
                      No tracking email yet?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      That's normal for the first 24-48 hours after you order — it's on its way.
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Status stuck for a while?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Tracking can lag by up to 24 hours. Give it a day, then get in touch if it's still stuck.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Still stuck?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our support team can look up your order directly
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
