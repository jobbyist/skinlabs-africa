import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CalendarClock, Sparkles, Target, ShoppingBag, GraduationCap, FlaskConical } from "lucide-react";
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
  "/learn": {
    eyebrow: "Academy",
    title: "SkinLabs® Academy is coming soon",
    description:
      "A self-paced online learning platform for people who want to start — and run — their own skincare business in South Africa. Curriculum designed around formulation literacy, compliance, sourcing and go-to-market.",
    bullets: [
      "Modules on actives, barriers, claims language and SA regulatory basics",
      "Business tracks: pricing, shelf strategy, supplier diligence and brand voice",
      "Practical assignments scored against the same SkinLabs review standards",
    ],
    launch: "Curriculum in development — join the waitlist via membership",
    icon: GraduationCap,
    primary: { label: "Explore Business Suite", to: "/business" },
  },
  "/ingredients": {
    eyebrow: "Ingredients",
    title: "The Ingredients Hub is coming soon",
    description:
      "A skincare ingredients knowledge base with plain-language science and a combination analyser that flags clashes and compatible stacks — part of the SkinLabs® intelligence layer.",
    bullets: [
      "Ingredient profiles: what it does, who it suits, SA climate caveats",
      "Clash and mesh analyser for multi-active routines",
      "Linked to briefings, reviews and SKYNN AI recommendations across the platform",
    ],
    launch: "Rolling out inside the skincare intelligence layer",
    icon: FlaskConical,
    primary: { label: "Try SKYNN AI skin analysis", to: "/skynn-ai" },
  },
  "/routines": {
    eyebrow: "Routines",
    title: "Smart Routines is coming soon",
    description:
      "A living AM and PM routine that adapts to your skin, the season and the products already on your shelf — built from your SKYNN AI profile.",
    bullets: [
      "Step-by-step AM and PM schedules with timing and layering",
      "Automatic actives calendar so you never over-exfoliate",
      "Swap suggestions based on what South African retailers actually stock",
    ],
    launch: "Launching to members first",
    icon: Target,
    primary: { label: "Build your AI skin profile", to: "/skynn-ai" },
  },
  "/marketplace": {
    eyebrow: "Marketplace",
    title: "The SkinLabs Marketplace is coming soon",
    description:
      "A curated shelf of vetted local and global skincare, scored by the same review methodology you already read here — with member pricing.",
    bullets: [
      "Only products that pass our review scoring",
      "Transparent ingredient and claim context for South African shoppers",
      "Saved lists and restock alerts for members",
    ],
    launch: "Phased rollout after curation",
    icon: ShoppingBag,
    primary: { label: "Read product reviews", to: "/reviews" },
  },
  "/consult": {
    eyebrow: "Consult",
    title: "Consultations are coming soon",
    description:
      "Book structured skin consultations informed by your SkinLabs profile — not a generic ten-minute chat.",
    bullets: [
      "Prep pack from your SKYNN AI and routine history",
      "Clear next steps you can take to a clinic or pharmacy",
      "Member priority booking when slots open",
    ],
    launch: "Pilot with selected partners",
    icon: CalendarClock,
    primary: { label: "Explore memberships", to: "/pricing" },
  },
};

const fallback: ComingSoonConfig = {
  eyebrow: "Coming soon",
  title: "This page is almost ready",
  description: "SkinLabs is building the next layer of skin intelligence for South Africa. Check back shortly.",
  bullets: ["Editorial briefings already live", "SKYNN AI skin analysis in beta", "More tools rolling out to members first"],
  launch: "In progress",
  icon: Sparkles,
  primary: { label: "Back to home", to: "/" },
};

const ComingSoon = () => {
  const { pathname } = useLocation();
  const config = configs[pathname] ?? fallback;
  const Icon = config.icon;
  const canonical = `${SITE_URL}${pathname}`;

  return (
    <>
      <Helmet>
        <title>{config.title} | SkinLabs®</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-3xl px-4 pb-24 pt-28">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
            <Icon className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{config.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{config.description}</p>
          <ul className="mt-8 space-y-3">
            {config.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm font-medium text-foreground">{config.launch}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to={config.primary.to}>{config.primary.label}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ComingSoon;
