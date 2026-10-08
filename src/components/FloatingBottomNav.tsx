import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Mic, Star, ArrowLeftRight, User, LogIn, Sparkles, ListChecks, Compass, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { cn } from "@/lib/utils";
import { EMPTY_FACTS } from "@/lib/journey";
import { EMPTY_CONTEXT_FACTS, contextualNavigation, isNavTabActive, readSkinProfileHint, SKIN_PROFILE_HINT_EVENT, type NavTabId } from "@/lib/context";
import { resolveDashboardSection } from "@/lib/dashboardTabs";
import { OPEN_MENU_EVENT } from "@/lib/context/menuEvent";
import { prefetchPath } from "@/lib/routePrefetch";
import "@/styles/skinlabs-experience.css";

const TAB_ICONS: Record<NavTabId, LucideIcon> = {
  home: Home,
  news: Newspaper,
  stream: Mic,
  reviews: Star,
  compare: ArrowLeftRight,
  my_skin: Sparkles,
  routine: ListChecks,
  explore: Compass,
  account: User,
};

const NAV_ITEM = "group relative z-10 flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0 whitespace-nowrap rounded-full p-0 text-[10px] font-medium leading-[12px] transition-[color,transform] duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation hover:bg-transparent min-[360px]:w-12 sm:w-16 [&_svg]:size-5";
const TAB_IDLE = "text-foreground/80 hover:text-foreground";
const TAB_ACTIVE = "font-semibold text-foreground";
const ICON_STYLE = "relative size-5 -translate-y-1.5 transition-[transform,stroke-width] duration-200 ease-out group-aria-[current=page]:translate-y-0 group-aria-[current=page]:scale-150 group-aria-[current=page]:[stroke-width:2.75]";
const LABEL_STYLE = "absolute bottom-1 transition-opacity duration-200 ease-out group-aria-[current=page]:opacity-0";
// The Advanced AI Dermatology Analysis has its own sticky action bar.
const hasOwnBottomBar = (pathname: string) =>
  pathname.startsWith("/marketplace") || pathname.startsWith("/brand-ambassadors") || pathname.startsWith("/skynn-ai/advanced") || pathname.startsWith("/giveaways");

/**
 * Mobile primary navigation. Which five destinations get a permanent slot follows the
 * member (src/lib/context/navigation.ts): the public content tabs for visitors and new
 * members, Home · My Skin · Routine · Explore · Account once a skin profile exists.
 * Everything stays reachable from the header menu either way.
 */
const FloatingBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const { current: currentEpisode } = usePodcastPlayer();
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  // A cheap per-account hint (written when the member snapshot loads or an analysis is saved),
  // so navigation adapts on every page without running the whole snapshot site-wide.
  const [hasProfile, setHasProfile] = useState(() => readSkinProfileHint(user?.id));
  useEffect(() => {
    const read = () => setHasProfile(readSkinProfileHint(user?.id));
    read();
    window.addEventListener(SKIN_PROFILE_HINT_EVENT, read);
    return () => window.removeEventListener(SKIN_PROFILE_HINT_EVENT, read);
  }, [user?.id]);

  useEffect(() => {
    setNavVisible(true);
    lastScrollY.current = window.scrollY;
  }, [location.pathname, location.search]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateVisibility = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const atTop = scrollY <= 8;
      const atBottom = documentHeight - (scrollY + viewportHeight) <= 8;

      if (atTop || atBottom) {
        setNavVisible(true);
      } else if (scrollY > lastScrollY.current) {
        setNavVisible(false);
      } else if (scrollY < lastScrollY.current) {
        setNavVisible(true);
      }

      lastScrollY.current = scrollY;
      rafId.current = null;
    };

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Lets CSS reserve room for the fixed podcast mini-player at the end of every page (index.css).
  useEffect(() => {
    document.documentElement.dataset.miniPlayer = currentEpisode ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.miniPlayer;
    };
  }, [currentEpisode]);

  // Tapping the tab you're already on glides back to the top (the usual native-app gesture).
  const glideTopIfActive = (active: boolean) => (event: MouseEvent) => {
    if (!active) return;
    event.preventDefault();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  };

  const tabs = contextualNavigation({
    ...EMPTY_CONTEXT_FACTS({ ...EMPTY_FACTS, signedIn: Boolean(user), savedAnalyses: hasProfile ? 1 : 0 }),
  });
  // The five primary destinations are one tap away: have their chunks ready when the page settles.
  const tabHrefs = tabs.map((t) => t.href ?? "").join("|");
  useEffect(() => {
    const warm = () => tabHrefs.split("|").filter(Boolean).forEach(prefetchPath);
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const handle = ric ? ric(warm, { timeout: 3000 }) : window.setTimeout(warm, 2000);
    return () => {
      if (!ric) window.clearTimeout(handle);
    };
  }, [tabHrefs]);
  const onDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const section = onDashboard ? resolveDashboardSection(new URLSearchParams(location.search).get("tab")) : null;
  const personalised = tabs.some((t) => t.id === "account");
  const accountActive = location.pathname.startsWith("/dashboard");

  const activeId = tabs.find((tab) => isNavTabActive(tab, location.pathname, section))?.id
    ?? (!personalised && user && accountActive ? "profile" : null);

  if (hasOwnBottomBar(location.pathname)) return null;

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-transform duration-200 ease-out min-[360px]:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]",
          currentEpisode ? "translate-y-0 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:pb-[calc(env(safe-area-inset-bottom)+7rem)]" : "translate-y-0",
          !navVisible && "translate-y-[120%]",
        )}
      >
        <div className="gradient-border-anim relative flex max-w-full items-center rounded-full bg-background/90 p-2 shadow-xl backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/85">
          {tabs.map((tab) => {
            const active = activeId === tab.id;
            const Icon = TAB_ICONS[tab.id];
            const inner = (
              <>
                <Icon className={ICON_STYLE} aria-hidden="true" />
                <span className={LABEL_STYLE} aria-hidden={active}>{tab.label}</span>
              </>
            );
            const className = cn(NAV_ITEM, active ? TAB_ACTIVE : TAB_IDLE);
            // "Explore" opens the menu's Explore grid; every other tab is a plain link.
            return tab.href ? (
              <Link
                key={tab.id}
                to={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                onClick={glideTopIfActive(active && location.pathname === tab.href)}
                className={className}
              >
                {inner}
              </Link>
            ) : (
              <Button
                variant="ghost"
                key={tab.id}
                type="button"
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
                className={className}
              >
                {inner}
              </Button>
            );
          })}
          {!personalised && (user ? (
            <Link
              to="/dashboard"
              aria-label="Profile"
              aria-current={accountActive ? "page" : undefined}
              onClick={glideTopIfActive(accountActive && location.pathname === "/dashboard" && !location.search)}
              className={cn(NAV_ITEM, accountActive ? TAB_ACTIVE : TAB_IDLE)}
            >
              <User className={ICON_STYLE} aria-hidden="true" />
              <span className={LABEL_STYLE} aria-hidden={accountActive}>Profile</span>
            </Link>
          ) : (
            <Button variant="ghost" type="button" onClick={() => setAuthOpen(true)} aria-label="Sign in" className={cn(NAV_ITEM, TAB_IDLE)}>
              <LogIn className={ICON_STYLE} aria-hidden="true" />
              <span className={LABEL_STYLE}>Sign In</span>
            </Button>
          ))}
        </div>
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    </>
  );
};

export default FloatingBottomNav;
