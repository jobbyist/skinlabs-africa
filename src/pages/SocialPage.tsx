import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const socialPlatforms = {
  instagram: {
    title: "Instagram",
    icon: Instagram,
    description: "Follow SKINLABS on Instagram for skincare tips, routines, and launches.",
  },
  twitter: {
    title: "Twitter",
    icon: Twitter,
    description: "Get the latest updates and announcements from SKINLABS.",
  },
  facebook: {
    title: "Facebook",
    icon: Facebook,
    description: "Join our community and see customer stories on Facebook.",
  },
  youtube: {
    title: "YouTube",
    icon: Youtube,
    description: "Watch tutorials and skincare education from SKINLABS.",
  },
};

const SocialPage = () => {
  const { platform } = useParams();
  const selected = platform ? socialPlatforms[platform as keyof typeof socialPlatforms] : null;

  if (!selected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Social page not found</h1>
            <p className="text-muted-foreground mb-6">
              We could not find that social channel. Explore our products instead.
            </p>
            <Button asChild>
              <Link to="/products">Shop products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = selected.icon;

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
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <Icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider">Social</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {selected.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">{selected.description}</p>
            <Button asChild>
              <Link to="/contact">Contact the team</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SocialPage;
