import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const policies = {
  "privacy-policy": {
    title: "Privacy Policy",
    description: "Understand how SKINLABS collects, uses, and protects your personal information.",
  },
  "terms-of-service": {
    title: "Terms of Service",
    description: "Review the terms and conditions for using SKINLABS services and products.",
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: "Learn how cookies are used to personalize your SKINLABS experience.",
  },
};

type PolicyKey = keyof typeof policies;

interface PolicyPageProps {
  policyKey: PolicyKey;
}

const PolicyPage = ({ policyKey }: PolicyPageProps) => {
  const policy = policies[policyKey];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{policy.title} | SKINLABS</title>
        <meta name="description" content={policy.description} />
      </Helmet>
      <Header />
      <main className="pt-24 pb-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Policies</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {policy.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{policy.description}</p>
            <Button asChild>
              <Link to="/contact">Questions? Contact us</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PolicyPage;
