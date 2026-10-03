import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Mic, Star, ArrowLeftRight, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { cn } from "@/lib/utils";
import "@/styles/skinlabs-experience.css";

const tabs = [
  { label: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { label: "News", href: "/briefings", icon: Newspaper, match: (p: string) => p.startsWith("/briefings") || p.startsWith("/newsroom") },
  { label: "Stream", href: "/podcast", icon: Mic, match: (p: string) => p.startsWith("/podcast") || p.startsWith("/stream") },
  { label: "Reviews", href: "/reviews", icon: Star, match: (p: string) => p.startsWith("/reviews") },
  { label: "Compare", href: "/compare", icon: ArrowLeftRight, match: (p: string) => p.startsWith("/compare") },
];

const NAV_ITEM = "group relative flex flex-col items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-2 min-[360px]:px-2 min-[380px]:px-2.5 text-[10px] font-medium transition-[color,transform] duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4";
const TAB_IDLE = "text-foreground/80 hover:text-foreground";
const TAB_ACTIVE = "font-semibold text-foreground";
// The Advanced AI Dermatology Analysis has its own sticky action bar.
const hasOwnBottomBar = (pathname: string) =>
  pathname.startsWith("/marketplace") || pathname.startsWith("/brand-ambassadors") || pathname.startsWith("/skynn-ai/advanced");

const FloatingBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const { current: currentEpisode } = usePodcastPlayer();
  if (hasOwnBottomBar(location.pathname)) return null;
  const accountActive = location.pathname.startsWith("/dashboard");

  return (
    <>
      <nav aria-label="Primary" className={cn("fixed inset-x-0 z-40 flex justify-center px-2 min-[360px]:px-4 pb-[max(0px,env(safe-area-inset-bottom))] transition-[bottom] duration-300 ease-out", currentEpisode ? "bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-28" : "bottom-4 sm:bottom-6")}>
        <div className={cn("gradient-border-anim flex max-w-full items-center gap-0 min-[380px]:gap-0.5 rounded-full bg-background/90 px-1.5 py-2 sm:px-2 shadow-xl backdrop-blur-xl backdrop-saturate-150", "supports-[backdrop-filter]:bg-background/85")}>
          {tabs.map((tab) => {
            const active = tab.match(location.pathname);
            return <Link key={tab.label} to={tab.href} aria-label={tab.label} aria-current={active ? "page" : undefined} className={cn(NAV_ITEM, active ? TAB_ACTIVE : TAB_IDLE)}>
              {active && <span className="gradient-bg-soft absolute inset-0 rounded-full opacity-30" aria-hidden="true" />}
              <tab.icon className={cn("relative h-5 w-5 transition-transform duration-200 ease-out", active && "scale-110")} />
              <span className="relative leading-none">{tab.label}</span>
            </Link>;
          })}
          {user ? (
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
          )}
        </div>
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" />
    </>
  );
};

export default FloatingBottomNav;
