import { useEffect, useState } from "react";
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

const NAV_ITEM = "group relative flex flex-col items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-2 min-[360px]:px-2 min-[380px]:px-2.5 text-[10px] font-medium transition-[color,transform] duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4";
const TAB_IDLE = "text-foreground/80 hover:text-foreground";
const TAB_ACTIVE = "font-semibold text-foreground";
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
  const { current: currentEpisode } = usePodcastPlayer();
  // A cheap per-account hint (written when the member snapshot loads or an analysis is saved),
  // so navigation adapts on every page without running the whole snapshot site-wide.
  const [hasProfile, setHasProfile] = useState(() => readSkinProfileHint(user?.id));
  useEffect(() => {
    const read = () => setHasProfile(readSkinProfileHint(user?.id));
    read();
    window.addEventListener(SKIN_PROFILE_HINT_EVENT, read);
    return () => window.removeEventListener(SKIN_PROFILE_HINT_EVENT, read);
  }, [user?.id]);
  if (hasOwnBottomBar(location.pathname)) return null;

  const tabs = contextualNavigation({
    ...EMPTY_CONTEXT_FACTS({ ...EMPTY_FACTS, signedIn: Boolean(user), savedAnalyses: hasProfile ? 1 : 0 }),
  });
  const onDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const section = onDashboard ? resolveDashboardSection(new URLSearchParams(location.search).get("tab")) : null;
  const personalised = tabs.some((t) => t.id === "account");
  const accountActive = location.pathname.startsWith("/dashboard");

  return (
    <>
      <nav aria-label="Primary" className={cn("fixed inset-x-0 z-40 flex justify-center px-2 min-[360px]:px-4 pb-[max(0px,env(safe-area-inset-bottom))] transition-[bottom] duration-300 ease-out", currentEpisode ? "bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-28" : "bottom-4 sm:bottom-6")}>
        <div className={cn("gradient-border-anim flex max-w-full items-center gap-0 min-[380px]:gap-0.5 rounded-full bg-background/90 px-1.5 py-2 sm:px-2 shadow-xl backdrop-blur-xl backdrop-saturate-150", "supports-[backdrop-filter]:bg-background/85")}>
          {tabs.map((tab) => {
            const active = isNavTabActive(tab, location.pathname, section);
            const Icon = TAB_ICONS[tab.id];
            const inner = (
              <>
                {active && <span className="gradient-bg-soft absolute inset-0 rounded-full opacity-30" aria-hidden="true" />}
                <Icon className={cn("relative h-5 w-5 transition-transform duration-200 ease-out", active && "scale-110")} />
                <span className="relative leading-none">{tab.label}</span>
              </>
            );
            const className = cn(NAV_ITEM, active ? TAB_ACTIVE : TAB_IDLE);
            // "Explore" opens the menu's Explore grid; every other tab is a plain link.
            return tab.href ? (
              <Link key={tab.id} to={tab.href} aria-label={tab.label} aria-current={active ? "page" : undefined} className={className}>
                {inner}
              </Link>
            ) : (
              <button key={tab.id} type="button" aria-label={tab.label} aria-current={active ? "page" : undefined} onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))} className={className}>
                {inner}
              </button>
            );
          })}
          {!personalised && (user ? (
            <Link to="/dashboard" aria-label="Profile" aria-current={accountActive ? "page" : undefined} className={cn(NAV_ITEM, accountActive ? TAB_ACTIVE : TAB_IDLE)}>
              {accountActive && <span className="gradient-bg-soft absolute inset-0 rounded-full opacity-30" aria-hidden="true" />}
              <User className={cn("relative h-5 w-5 transition-transform duration-200 ease-out", accountActive && "scale-110")} />
              <span className="relative leading-none">Profile</span>
            </Link>
          ) : (
            <button type="button" onClick={() => setAuthOpen(true)} aria-label="Sign in" className={cn(NAV_ITEM, TAB_IDLE)}>
              <LogIn className="relative h-5 w-5" />
              <span className="relative leading-none">Sign In</span>
            </button>
          ))}
        </div>
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    </>
  );
};

export default FloatingBottomNav;
