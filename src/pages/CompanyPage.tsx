import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const companyPages = {
  "our-science": {
    title: "Our Science",
    description: "Learn how SKINLABS combines dermatology research with AI-powered insights.",
  },
  sustainability: {
    title: "Sustainability",
    description: "Discover our commitment to responsible sourcing, packaging, and community impact.",
  },
  careers: {
    title: "Careers",
    description: "Join a team focused on redefining skincare through innovation and empathy.",
  },
  press: {
    title: "Press",
    description: "Explore featured stories, announcements, and media resources.",
  },
};

const CompanyPage = () => {
  const { page } = useParams();
  const selected = page ? companyPages[page as keyof typeof companyPages] : null;

  if (!selected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Page not found</h1>
            <p className="text-muted-foreground mb-6">
              We could not find that company page. Head back to learn more about SKINLABS.
            </p>
            <Button asChild>
              <Link to="/about">Go to About</Link>
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
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Company</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {selected.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{selected.description}</p>
            <Button asChild>
              <Link to="/contact">Contact our team</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyPage;
