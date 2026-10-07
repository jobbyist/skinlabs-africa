import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Mic, Star, ArrowLeftRight, User, LogIn, Sparkles, ListChecks, Compass, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { cn } from "@/lib/utils";
import { EMPTY_FACTS } from "@/lib/journey";
import { EMPTY_CONTEXT_FACTS, contextualNavigation, isNavTabActive, readSkinProfileHint, SKIN_PROFILE_HINT_EVENT, type NavTabId } from "@/lib/context";
import { resolveDashboardSection } from "@/lib/dashboardTabs";
import { OPEN_MENU_EVENT } from "@/lib/context/menuEvent";
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

const NAV_ITEM = "group relative z-10 flex min-h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-1.5 text-[10px] font-medium leading-[12px] transition-[color,transform] duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation min-[360px]:px-2 min-[380px]:px-2.5 sm:px-4";
const TAB_IDLE = "text-foreground/80 hover:text-foreground";
const TAB_ACTIVE = "font-semibold text-foreground";
const INDICATOR_TRANSITION = "pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full bg-foreground/[0.07] shadow-sm transition-[transform,width,opacity] duration-200 ease-out";
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
  const [indicator, setIndicator] = useState({ x: 0, width: 0, visible: false });
  const { current: currentEpisode } = usePodcastPlayer();
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
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

  if (hasOwnBottomBar(location.pathname)) return null;

  const tabs = contextualNavigation({
    ...EMPTY_CONTEXT_FACTS({ ...EMPTY_FACTS, signedIn: Boolean(user), savedAnalyses: hasProfile ? 1 : 0 }),
  });
  const onDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const section = onDashboard ? resolveDashboardSection(new URLSearchParams(location.search).get("tab")) : null;
  const personalised = tabs.some((t) => t.id === "account");
  const accountActive = location.pathname.startsWith("/dashboard");

  const activeId = personalised
    ? tabs.find((tab) => isNavTabActive(tab, location.pathname, section))?.id ?? null
    : user && accountActive
      ? "profile"
      : null;

  useEffect(() => {
    if (!activeId) {
      setIndicator((current) => current.visible ? { ...current, visible: false } : current);
      return;
    }

    const updateIndicator = () => {
      const item = itemRefs.current[activeId];
      const nav = navRef.current;
      if (!item || !nav) return;

      const itemRect = item.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const x = itemRect.left - navRect.left;

      setIndicator({ x, width: itemRect.width, visible: true });
    };

    updateIndicator();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null;
    if (observer) {
      if (navRef.current) observer.observe(navRef.current);
      const item = itemRefs.current[activeId];
      if (item) observer.observe(item);
    }

    window.addEventListener("resize", updateIndicator);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeId, hasProfile, personalised, location.pathname, location.search, user?.id]);

  const setItemRef = (id: string) => (element: HTMLElement | null) => {
    itemRefs.current[id] = element;
  };

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-transform duration-200 ease-out min-[360px]:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]",
          currentEpisode ? "translate-y-0 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:pb-[calc(env(safe-area-inset-bottom)+7rem)]" : "translate-y-0",
          !navVisible && "translate-y-[120%]",
        )}
      >
        <div className="relative flex max-w-full items-center gap-0 rounded-full border border-border/60 bg-background/90 px-1.5 py-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/85 min-[380px]:gap-0.5 sm:px-2">
          <span
            className={cn(INDICATOR_TRANSITION, !indicator.visible && "opacity-0")}
            style={{ width: indicator.width, transform: `translateX(${indicator.x}px)` }}
            aria-hidden="true"
          />
          {tabs.map((tab) => {
            const active = isNavTabActive(tab, location.pathname, section);
            const Icon = TAB_ICONS[tab.id];
            const inner = (
              <>
                <Icon className={cn("relative h-5 w-5 transition-transform duration-200 ease-out", active && "scale-110")} />
                <span className="relative">{tab.label}</span>
              </>
            );
            const className = cn(NAV_ITEM, active ? TAB_ACTIVE : TAB_IDLE);
            // "Explore" opens the menu's Explore grid; every other tab is a plain link.
            return tab.href ? (
              <Link
                key={tab.id}
                ref={setItemRef(tab.id)}
                to={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={tab.id}
                ref={setItemRef(tab.id)}
                type="button"
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
                className={className}
              >
                {inner}
              </button>
            );
          })}
          {!personalised && (user ? (
            <Link
              ref={setItemRef("profile")}
              to="/dashboard"
              aria-label="Profile"
              aria-current={accountActive ? "page" : undefined}
              className={cn(NAV_ITEM, accountActive ? TAB_ACTIVE : TAB_IDLE)}
            >
              <User className={cn("relative h-5 w-5 transition-transform duration-200 ease-out", accountActive && "scale-110")} />
              <span className="relative">Profile</span>
            </Link>
          ) : (
            <button type="button" onClick={() => setAuthOpen(true)} aria-label="Sign in" className={cn(NAV_ITEM, TAB_IDLE)}>
              <LogIn className="relative h-5 w-5" />
              <span className="relative">Sign In</span>
            </button>
          ))}
        </div>
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    </>
  );
};

export default FloatingBottomNav;
