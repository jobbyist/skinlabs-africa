import { Link, useLocation } from "react-router-dom";
import {
  Beaker,
  Headphones,
  Newspaper,
  Scale,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackConversionEvent } from "@/lib/analytics-events";

type ContentRailItem = {
  label: string;
  href: string;
  activePath: string;
  icon: typeof Newspaper;
  kind: string;
};

const items: ContentRailItem[] = [
  {
    label: "The Daily Skinny",
    href: "/briefings",
    activePath: "/briefings",
    icon: Newspaper,
    kind: "daily_skinny",
  },
  {
    label: "Verified Reviews",
    href: "/reviews",
    activePath: "/reviews",
    icon: Star,
    kind: "verified_reviews",
  },
  {
    label: "Shelf Showdown",
    href: "/compare",
    activePath: "/compare",
    icon: Scale,
    kind: "shelf_showdown",
  },
  {
    label: "Brand Spotlight",
    href: "/spotlight",
    activePath: "/spotlight",
    icon: Tag,
    kind: "brand_spotlight",
  },
  {
    label: "Ingredient Dossier",
    href: "/ingredients",
    activePath: "/ingredients",
    icon: Beaker,
    kind: "ingredient_dossier",
  },
  {
    label: "The Skin Deep Podcast",
    href: "/podcast",
    activePath: "/podcast",
    icon: Headphones,
    kind: "skin_deep_podcast",
  },
  {
    label: "AI Skin Analysis",
    href: "/skynn-ai",
    activePath: "/skynn-ai",
    icon: Sparkles,
    kind: "ai_skin_analysis",
  },
];

const isActive = (pathname: string, item: ContentRailItem) =>
  pathname === item.activePath || pathname.startsWith(`${item.activePath}/`);

const MobileContentRail = ({ storyRail = false }: { storyRail?: boolean }) => {
  const { pathname } = useLocation();

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Content sections"
        className={cn(
          "sticky z-40 border-b border-border/70 bg-background/95 backdrop-blur-md md:hidden",
          storyRail ? "top-40" : "top-16",
        )}
      >
        <div className="relative">
          <div
            className="scrollbar-hide flex min-w-0 gap-2 overflow-x-auto px-4 py-2.5 pr-12"
            aria-describedby="content-rail-hint"
          >
            {items.map((item) => {
              const active = isActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    trackConversionEvent("content_vertical_clicked", {
                      vertical: item.kind,
                      source: pathname === "/" ? "homepage_rail" : "sitewide_rail",
                    });
                  }}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[12px] font-semibold tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-border bg-background text-foreground/80 hover:bg-accent hover:text-foreground",
                    item.kind === "ai_skin_analysis" &&
                      !active &&
                      "border-primary/30 bg-accent/60",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent"
          />
        </div>

        <span id="content-rail-hint" className="sr-only">
          Scroll horizontally to browse content sections.
        </span>
      </nav>
    </>
  );
};

export default MobileContentRail;
