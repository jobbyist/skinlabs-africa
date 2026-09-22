import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Mic, Star, ArrowLeftRight, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { label: "News", href: "/briefings", icon: Newspaper, match: (p: string) => p.startsWith("/briefings") || p.startsWith("/newsroom") },
  { label: "Stream", href: "/podcast", icon: Mic, match: (p: string) => p.startsWith("/podcast") || p.startsWith("/stream") },
  { label: "Reviews", href: "/reviews", icon: Star, match: (p: string) => p.startsWith("/reviews") },
  { label: "Compare", href: "/compare", icon: ArrowLeftRight, match: (p: string) => p.startsWith("/compare") },
];

/**
 * Routes that render their own primary bottom bar (Openhaus marketplace's
 * sticky nav/cart bar, the Brand Ambassador page's sticky Apply CTA). This
 * floating nav must never stack on top of those — hide it there instead of
 * trying to keep two bottom bars' offsets in sync.
 */
const hasOwnBottomBar = (pathname: string) =>
  pathname.startsWith("/marketplace") || pathname.startsWith("/brand-ambassadors");

/**
 * Shown to every visitor, signed in or not — five of these six destinations
 * (everything but the account tab) are free, public content, so gating the
 * whole nav behind login worked against the free-acquisition/SEO-discovery
 * product principle for the majority of first-time mobile traffic. The last
 * tab adapts instead: "Profile" -> /dashboard when signed in, "Sign In" ->
 * opens AuthDialog in place when not, rather than sending a logged-out
 * visitor to a dashboard route that would just bounce them back out.
 */
const FloatingBottomNav = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  // PodcastPlayer renders its own fixed bar flush against bottom-0 whenever an
  // episode is loaded (whether playing or paused) — at a higher z-index than
  // this nav, so without this it visually covers/overlaps the floating pill.
  // Shifting the pill up above the player's height (see PodcastPlayer.tsx's
  // py-3/md:py-4 + h-14/md:h-16 artwork, ~80-96px tall) keeps both usable.
  const { current: currentEpisode } = usePodcastPlayer();

  // Never hide the whole bar while auth is resolving — that caused a missing
  // bottom nav flash (and a stuck-empty bar if the session check hung). Show
  // the public tabs immediately; only the account tab depends on user.
  if (hasOwnBottomBar(location.pathname)) return null;

  const accountActive = location.pathname.startsWith("/dashboard");

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 z-40 flex justify-center px-4 pb-[max(0px,env(safe-area-inset-bottom))] transition-[bottom] duration-300 ease-out",
          currentEpisode ? "bottom-24 sm:bottom-28" : "bottom-4 sm:bottom-6",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full border border-white/20 bg-background/60 px-2 py-2 shadow-xl backdrop-blur-xl backdrop-saturate-150",
            "supports-[backdrop-filter]:bg-background/40 dark:border-white/10",
          )}
        >
          {tabs.map((tab) => {
            const active = tab.match(location.pathname);
            return (
              <Link
                key={tab.label}
                to={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 text-[10px] font-medium transition-colors sm:px-4",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && <span className="gradient-bg-soft absolute inset-0 rounded-full opacity-30" aria-hidden="true" />}
                <tab.icon className={cn("relative h-5 w-5 transition-transform", active && "scale-110")} />
                <span className="relative leading-none">{tab.label}</span>
              </Link>
            );
          })}

          {user ? (
            <Link
              to="/dashboard"
              aria-label="Profile"
              aria-current={accountActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 text-[10px] font-medium transition-colors sm:px-4",
                accountActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {accountActive && (
                <span className="gradient-bg-soft absolute inset-0 rounded-full opacity-30" aria-hidden="true" />
              )}
              <User className={cn("relative h-5 w-5 transition-transform", accountActive && "scale-110")} />
              <span className="relative leading-none">Profile</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              aria-label="Sign in"
              className="group relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
            >
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
