import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const supportPages = {
  faq: {
    title: "FAQ",
    description: "Answers to the most common questions about SKINLABS products and subscriptions.",
  },
  shipping: {
    title: "Shipping",
    description: "Find shipping timelines, regions served, and delivery updates.",
  },
  returns: {
    title: "Returns",
    description: "Learn about return eligibility and how to start a return.",
  },
  "track-order": {
    title: "Track Order",
    description: "Stay updated on the status of your SKINLABS order.",
  },
};

const SupportPage = () => {
  const { page } = useParams();
  const selected = page ? supportPages[page as keyof typeof supportPages] : null;

  if (!selected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Support page not found</h1>
            <p className="text-muted-foreground mb-6">
              We could not find that support page. Visit our contact page for help.
            </p>
            <Button asChild>
              <Link to="/contact">Contact support</Link>
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
        <title>{selected.title} | SKINLABS Support</title>
        <meta name="description" content={selected.description} />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Support</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {selected.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{selected.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/contact">Contact support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupportPage;
