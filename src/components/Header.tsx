import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Newspaper,
  Star,
  Mic,
  Calendar,
  Search,
  Award,
  Sun,
  ShoppingBag,
  Scale,
  LogIn,
  Home,
  Target,
  FlaskConical,
  TrendingUp,
  Megaphone,
  BookOpenCheck,
  Compass,
  GraduationCap,
  Beaker,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AuthDialog from "@/components/AuthDialog";
import SiteSearch from "@/components/SiteSearch";
import { useAuth } from "@/hooks/use-auth";
import { useCrossDomainAuth } from "@/hooks/use-cross-domain-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/newskinlabs.png";

type NavIcon = typeof Home;

interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  badge?: "Coming Soon" | "NEW" | "BETA";
}

const primaryLinks: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Smart Routines", href: "/routines", icon: Target, badge: "Coming Soon" },
  { label: "Skin Analysis (SKYNN AI)", href: "/skynn-ai", icon: FlaskConical, badge: "BETA" },
  { label: "Business Suite", href: "/business", icon: TrendingUp, badge: "NEW" },
];

/** The "Explore" grid — SkinLabs' editorial + platform sections. */
const exploreLinks: NavItem[] = [
  { label: "Briefings", href: "/briefings", icon: Newspaper },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Consult", href: "/consult", icon: Calendar, badge: "Coming Soon" },
  { label: "Spotlight", href: "/spotlight", icon: Award, badge: "NEW" },
  { label: "Seasonals", href: "/seasonals", icon: Sun, badge: "NEW" },
  { label: "Comparisons", href: "/compare", icon: Scale, badge: "NEW" },
  { label: "Podcast", href: "/podcast", icon: Mic },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, badge: "Coming Soon" },
];

/** Reference / resource rows below the Explore grid. */
const resourceLinks: NavItem[] = [
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Knowledge Hub", href: "/knowledge-hub", icon: BookOpenCheck },
  { label: "Methodologies", href: "/spotlight/methodology", icon: Compass },
  { label: "Partner Program", href: "/partners", icon: Users },
  { label: "Work With Us", href: "/partners", icon: Handshake },
];

const NavBadge = ({ badge }: { badge: NonNullable<NavItem["badge"]> }) => (
  <span
    className={cn(
      "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none whitespace-nowrap",
      badge === "Coming Soon" ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground",
    )}
  >
    {badge}
  </span>
);

const ExploreCard = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border px-2 py-4 text-center transition-colors hover:bg-accent"
  >
    <item.icon className="h-5 w-5 text-foreground" aria-hidden />
    <span className="flex flex-wrap items-center justify-center gap-1 text-sm font-medium text-foreground">
      {item.label}
      {item.badge && <NavBadge badge={item.badge} />}
    </span>
  </Link>
);

const ResourceRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className="flex items-center justify-between rounded-xl px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
  >
    <span className="flex items-center gap-2">
      <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      {item.label}
    </span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
  </Link>
);

const DesktopMenuPanel = ({ onNavigate }: { onNavigate?: () => void }) => (
  <div className="w-[min(92vw,720px)] p-1">
    {/* Primary links */}
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-2 py-2">
      {primaryLinks.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onNavigate}
          className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label.replace(" (SKYNN AI)", "")}
            {item.label.includes("SKYNN AI") && (
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                SKYNN AI
              </span>
            )}
          </span>
          {item.badge && <NavBadge badge={item.badge} />}
        </Link>
      ))}
    </div>

    <div className="my-2 border-t border-border" />

    {/* Explore grid */}
    <div className="px-2 pb-2">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Explore
      </p>
      <div className="grid grid-cols-4 gap-2">
        {exploreLinks.map((item) => (
          <ExploreCard key={item.label} item={item} onClick={onNavigate} />
        ))}
      </div>
    </div>

    <div className="my-2 border-t border-border" />

    {/* Resource links */}
    <div className="flex flex-wrap gap-x-1 gap-y-0.5 px-2 py-1">
      {resourceLinks.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          onClick={onNavigate}
          className="rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {item.label}
        </Link>
      ))}
    </div>

    <div className="mt-2 border-t border-border px-2 pt-3 pb-1">
      <Button asChild className="w-full justify-between" size="sm">
        <Link to="/" onClick={onNavigate}>
          Sign Up / Log In
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  </div>
);

const Header = () => {
  const [open, setOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [exploreOpen, setExploreOpen] = useState(true);
  const { user, signOut } = useAuth();
  useCrossDomainAuth();

  const closeMenu = () => setOpen(false);
  const closeDesktopMenu = () => setDesktopMenuOpen(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    closeMenu();
    closeDesktopMenu();
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={closeMenu}>
            <img src={logo} alt="SkinLabs" className="h-8 w-auto md:h-9" />
          </Link>

          {/* Desktop Menu button (replaces individual primary links) */}
          <div className="hidden lg:flex items-center">
            <Popover open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 px-3 font-medium"
                >
                  Menu
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      desktopMenuOpen && "rotate-180",
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-auto max-w-[min(92vw,760px)] rounded-2xl border bg-popover p-0 shadow-lg"
              >
                <DesktopMenuPanel onNavigate={closeDesktopMenu} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Right cluster: Search + SKYNN AI + Auth */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex h-9 gap-2 rounded-full border-border/80 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-sm">Search</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* SKYNN AI — animated multicolour gradient border, white bg, black text + Sparkles */}
            <Link
              to="/skynn-ai"
              className={cn(
                "gradient-border-anim hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-black shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              SKYNN AI
            </Link>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-full">
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="hidden sm:inline-flex rounded-full"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthOpen(true);
                }}
              >
                Log In / Sign Up
              </Button>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sheet — kept for small screens */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-lg font-bold">Menu</span>
            <Button variant="ghost" size="icon" onClick={closeMenu} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav aria-label="Primary" className="flex flex-col gap-1 px-3 py-3">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" /> {item.label}
                </span>
                {item.badge && <NavBadge badge={item.badge} />}
              </Link>
            ))}
          </nav>
          <Collapsible open={exploreOpen} onOpenChange={setExploreOpen} className="px-3 py-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold">
              Explore
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", exploreOpen && "rotate-180")}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 grid grid-cols-2 gap-2">
              {exploreLinks.map((item) => (
                <ExploreCard key={item.label} item={item} onClick={closeMenu} />
              ))}
            </CollapsibleContent>
          </Collapsible>
          <div className="border-t border-border px-3 py-3">
            {resourceLinks.map((item) => (
              <ResourceRow key={item.label} item={item} onClick={closeMenu} />
            ))}
          </div>
          <div className="border-t border-border px-4 py-4">
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthOpen(true);
                    closeMenu();
                  }}
                >
                  Sign in
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthOpen(true);
                    closeMenu();
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Create account
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
