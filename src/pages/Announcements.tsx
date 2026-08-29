import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Megaphone, Sparkles, Award, Sun, Mic, ShoppingBag, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Announcement {
  date: string;
  tag: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const announcements: Announcement[] = [
  {
    date: "2026-08-28",
    tag: "Coming Soon",
    icon: <ShoppingBag className="h-5 w-5" />,
    title: "Openhaus Marketplace is on its way",
    description:
      "We're building a multivendor marketplace for South African skincare brands. Join the waiting list on the Marketplace page for early-bird samples, giveaways and launch discounts.",
  },
  {
    date: "2026-08-20",
    tag: "Platform",
    icon: <Calendar className="h-5 w-5" />,
    title: "Consultations rebranded to Consult",
    description:
      "Virtual derm consultations now live under a shorter \"Consult\" label in the header — same HPCSA-registered practitioners, same booking flow, just easier to find on mobile.",
  },
  {
    date: "2026-08-12",
    tag: "New",
    icon: <Sun className="h-5 w-5" />,
    title: "Seasonal Guides launched",
    description:
      "Skincare advice built around the season you're actually living in, with regional notes for Gauteng, KZN, the Western Cape and the Eastern Cape.",
  },
  {
    date: "2026-08-01",
    tag: "New",
    icon: <Award className="h-5 w-5" />,
    title: "Spotlight by SkinLabs launched",
    description:
      "A monthly, review-led ranking of South African skincare brands, computed live from our own published product scores — never a paid placement.",
  },
  {
    date: "2026-06-15",
    tag: "Platform",
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI Formulator upgraded",
    description:
      "Personalised routines now factor in your climate zone, budget and skin concerns together, with weekly refreshes for Glow Insider and Glow VIP members.",
  },
  {
    date: "2026-02-05",
    tag: "New",
    icon: <Mic className="h-5 w-5" />,
    title: "The Skin Deep Podcast premiered",
    description:
      "Weekly episodes on skincare myths, ingredient science and SA-specific routines, with new instalments dropping every Wednesday.",
  },
];

const tagStyles: Record<string, string> = {
  "Coming Soon": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  New: "bg-primary/10 text-primary",
  Platform: "bg-secondary text-secondary-foreground",
};

const Announcements = () => {
  return (
    <>
      <Helmet>
        <title>Announcements — Product & Platform Updates | SKINLABS</title>
        <meta
          name="description"
          content="What's new on SkinLabs: platform launches, feature updates and what's coming next, including the Openhaus Marketplace."
        />
        <link rel="canonical" href="https://skinlabs.co.za/announcements" />
        <meta property="og:title" content="Announcements | SKINLABS" />
        <meta property="og:description" content="Platform launches, feature updates and what's coming next on SkinLabs." />
        <meta property="og:url" content="https://skinlabs.co.za/announcements" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Megaphone className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Announcements
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    What's new, what's changed, and what's coming next on SkinLabs.
                  </p>
                </div>

                <div className="space-y-6">
                  {announcements.map((item) => (
                    <div key={item.title} className="bg-card border border-border rounded-3xl p-6 md:p-8 flex gap-4">
                      <div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${tagStyles[item.tag] ?? "bg-muted text-muted-foreground"}`}>
                            {item.tag}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-1.5">{item.title}</h2>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
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

export default Announcements;
