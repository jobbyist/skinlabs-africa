import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  Beaker,
  Briefcase,
  Headphones,
  Newspaper,
  Scale,
  Sparkles,
  Star,
  Stethoscope,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useAuth } from "@/hooks/use-auth";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  contentRailOrderForThisPageLoad,
  isContentRailItemActive,
  shouldShowContentRail,
  type ContentRailKind,
} from "@/lib/contentRail";

const ICONS: Record<ContentRailKind, LucideIcon> = {
  ai_skin_analysis: Sparkles,
  daily_skinny: Newspaper,
  seasonal_guides: Sun,
  shelf_showdown: Scale,
  business_solutions: Briefcase,
  practice_suite: Stethoscope,
  verified_reviews: Star,
  brand_spotlight: Award,
  ingredient_dossier: Beaker,
  skin_deep_podcast: Headphones,
};

/** Rendered height, so Header can reserve matching flow space below the fixed bar. */
export const CONTENT_RAIL_HEIGHT_CLASS = "h-12";

/**
 * Mobile pill strip for jumping straight to a content vertical. Rendered INSIDE
 * Header's fixed bar so it always sits flush under the nav (no offset maths
 * against the story rail), and Header adds a same-height flow spacer so the page
 * content starts below it at the top of the page.
 *
 * Rules: phones only, signed-in members only, key pages only (home + each
 * vertical's hub), hidden on scroll down and revealed on scroll up, and shuffled
 * once per page load so no vertical always gets first position.
 */
const MobileContentRail = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const applies = shouldShowContentRail(pathname, Boolean(user));
  const revealed = useScrollReveal(applies);
  const scroller = useRef<HTMLDivElement>(null);
  const items = useMemo(() => contentRailOrderForThisPageLoad(), []);

  // The order is random, so the current section's pill may start off-screen:
  // bring it into view (inside the strip only; the page itself never scrolls).
  useEffect(() => {
    if (!applies) return;
    const box = scroller.current;
    const active = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !active) return;
    box.scrollTo({ left: Math.max(0, active.offsetLeft - 16), behavior: "auto" });
  }, [applies, pathname]);

  if (!applies) return null;

  return (
    <nav
      aria-label="Content sections"
      aria-hidden={!revealed}
      inert={!revealed}
      className={cn(
        "grid border-t border-border/60 transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden motion-reduce:transition-none",
        revealed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-t-transparent opacity-0",
      )}
    >
      <div className="relative min-h-0 overflow-hidden">
        <div
          ref={scroller}
          className={cn("scrollbar-hide flex min-w-0 items-center gap-2 overflow-x-auto px-4 pr-12", CONTENT_RAIL_HEIGHT_CLASS)}
        >
          {items.map((item) => {
            const active = isContentRailItemActive(pathname, item);
            const Icon = ICONS[item.kind];
            return (
              <Link
                key={item.kind}
                to={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() =>
                  trackConversionEvent("content_vertical_clicked", {
                    vertical: item.kind,
                    source: pathname === "/" ? "homepage_rail" : "sitewide_rail",
                  })
                }
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground/80 hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
        />
      </div>
    </nav>
  );
};

export default MobileContentRail;
