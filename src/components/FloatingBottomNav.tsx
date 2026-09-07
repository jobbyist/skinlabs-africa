import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Mic, Star, CalendarClock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { label: "News", href: "/briefings", icon: Newspaper, match: (p: string) => p.startsWith("/briefings") || p.startsWith("/newsroom") },
  { label: "Stream", href: "/podcast", icon: Mic, match: (p: string) => p.startsWith("/podcast") || p.startsWith("/stream") },
  { label: "Reviews", href: "/reviews", icon: Star, match: (p: string) => p.startsWith("/reviews") },
  { label: "Book", href: "/consultations", icon: CalendarClock, match: (p: string) => p.startsWith("/consultations") },
  { label: "Profile", href: "/dashboard", icon: User, match: (p: string) => p.startsWith("/dashboard") },
];

const FloatingBottomNav = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading || !user) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6"
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
              {active && (
                <span className="absolute inset-0 rounded-full bg-primary/10" aria-hidden="true" />
              )}
              <tab.icon className={cn("relative h-5 w-5 transition-transform", active && "scale-110")} />
              <span className="relative leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default FloatingBottomNav;
