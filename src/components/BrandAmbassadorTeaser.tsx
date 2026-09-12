import { Link } from "react-router-dom";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BA_SPOTS,
  BA_COMMISSION_PERCENT,
  BA_APPLICATIONS_CLOSE,
  getApplicationWindowStatus,
} from "@/data/brandAmbassador";

/**
 * Homepage section announcing that applications are open for the
 * SkinLabs® Brand Ambassador Programme 2026.
 * Design inspired by the programme social/OG artwork (illustration + bold type).
 */
const BrandAmbassadorTeaser = () => {
  const status = getApplicationWindowStatus();
  const isOpen = status === "open";

  return (
    <section id="brand-ambassadors" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="grid items-center gap-0 lg:grid-cols-2">
            {/* Visual */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[420px]">
              <img
                src="/og-brand-ambassadors.jpg"
                alt="SkinLabs Brand Ambassador Programme 2026 — TikTok & Instagram creators"
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/10" />
            </div>

            {/* Copy */}
            <div className="flex flex-col justify-center gap-6 p-8 md:p-12">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Applications {isOpen ? "now open" : "coming soon"}
                </p>
                <h2 className="font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  SkinLabs® Brand Ambassador Programme 2026
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                We’re recruiting {BA_SPOTS} TikTok and Instagram creators across South Africa for our
                founding programme. Earn {BA_COMMISSION_PERCENT} recurring commission on successful
                referrals, co-create evidence-led content, and grow with South Africa’s skin intelligence
                platform. Applications close {BA_APPLICATIONS_CLOSE}.
              </p>

              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>5K–50K followers (each platform assessed separately)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{BA_COMMISSION_PERCENT} recurring monthly commission on referrals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>Founding cohort of {BA_SPOTS} creators · potential 12-month partnership</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2" asChild disabled={!isOpen}>
                  <Link to="/brand-ambassadors">
                    {isOpen ? "Apply now" : "View programme"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/brand-ambassadors">Learn more</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandAmbassadorTeaser;
