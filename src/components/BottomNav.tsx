import { NavLink } from "react-router-dom";
import { Home, BookOpen, Radio, Star, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/", icon: Home, end: true },
  { label: "Guides", href: "/newsroom", icon: BookOpen, end: false },
  { label: "Stream", href: "/podcast", icon: Radio, end: false },
  { label: "Reviews", href: "/reviews", icon: Star, end: false },
  { label: "Profile", href: "/dashboard", icon: User, end: false },
];

/** Floating glass bottom tab bar — signed-in users only. */
const BottomNav = () => {
  const { user, loading } = useAuth();
  const { current } = usePodcastPlayer();

  if (loading || !user) return null;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 z-40 flex justify-center px-4 transition-[bottom] duration-300",
        current ? "bottom-20 md:bottom-24" : "bottom-4 md:bottom-6",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/70 p-1.5 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {TABS.map(({ label, href, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={href}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
