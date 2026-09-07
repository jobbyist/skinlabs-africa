import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CalendarClock, Sparkles, Target, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/seo-config";

interface ComingSoonConfig {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  launch: string;
  icon: typeof Target;
  primary: { label: string; to: string };
}

const configs: Record<string, ComingSoonConfig> = {
  "/routines": {
    eyebrow: "Routines",
    title: "Smart Routines is coming soon",
    description:
      "A living AM and PM routine that adapts to your skin, the season and the products already on your shelf — built from your AI Formulator profile.",
    bullets: [
      "Step-by-step AM and PM schedules with timing and layering",
      "Automatic actives calendar so you never over-exfoliate",
      "Swap suggestions based on what South African retailers actually stock",
    ],
    launch: "Launching to members first",
    icon: Target,
    primary: { label: "Build your AI skin profile", to: "/ai-formulator" },
  },
  "/marketplace": {
    eyebrow: "Marketplace",
    title: "The SkinLabs Marketplace is coming soon",
    description:
      "A curated shelf of vetted local and global skincare, scored by the same review methodology you already read here — with member pricing.",
    bullets: [
      "Only products that pass our review scoring",
      "Local stock, local pricing, local delivery",
      "Member-only bundles and loyalty rewards",
    ],
    launch: "Opening 1 December 2026",
    icon: ShoppingBag,
    primary: { label: "Join the launch list", to: "/shop" },
  },
};

const fallback = configs["/routines"];

const ComingSoon = () => {
  const { pathname } = useLocation();
  const config = configs[pathname] ?? fallback;
  const Icon = config.icon;

  return (
    <>
      <Helmet>
        <title>{`${config.eyebrow} — Coming Soon | SkinLabs®`}</title>
        <meta name="description" content={config.description.slice(0, 155)} />
        <link rel="canonical" href={`${SITE_URL}${pathname}`} />
        <meta property="og:title" content={`${config.eyebrow} — Coming Soon | SkinLabs®`} />
        <meta property="og:description" content={config.description.slice(0, 155)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-24">
          <section className="container mx-auto max-w-3xl px-4 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{config.eyebrow}</p>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{config.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{config.description}</p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground">
              <CalendarClock className="h-4 w-4 text-primary" />
              {config.launch}
            </div>

            <ul className="mx-auto mt-10 max-w-lg space-y-3 text-left">
              {config.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-border p-4">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={config.primary.to}>{config.primary.label}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ComingSoon;
