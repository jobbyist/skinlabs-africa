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
import ScrollProgressBar from "@/components/ScrollProgressBar";
import ThemeToggle from "@/components/ThemeToggle";
import PromoAnnouncementBar from "@/components/PromoAnnouncementBar";
import { useAuth } from "@/hooks/use-auth";
import { useCrossDomainAuth } from "@/hooks/use-cross-domain-auth";
import { usePromoBar } from "@/hooks/use-promo-bar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// Served from public/ (not a Vite-bundled src/assets import) — real light/
// dark wordmark exports, swapped via CSS (dark:hidden/dark:block) rather
// than a CSS filter on one file, so the actual PNG that's "live" for each
// theme is directly verifiable from a network request, not a filter effect.

type NavIcon = typeof Home;

interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  badge?: "Coming Soon" | "NEW" | "BETA";
}

const primaryLinks: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Smart Routines", href: "/routines", icon: Target },
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
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, badge: "NEW" },
  { label: "Ingredients", href: "/ingredients", icon: Beaker, badge: "NEW" },
  { label: "Academy", href: "/learn", icon: GraduationCap, badge: "Coming Soon" },
];

/** Reference / resource rows below the Explore grid. */
const resourceLinks: NavItem[] = [
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Knowledge Hub", href: "/knowledge-hub", icon: BookOpenCheck },
  { label: "Methodologies", href: "/spotlight/methodology", icon: Compass },
  { label: "Partner Program", href: "/partners", icon: Users },
];

const NavBadge = ({ badge }: { badge: NonNullable<NavItem["badge"]> }) => (
  <span
    className={cn(
      "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none whitespace-nowrap text-white",
      badge === "Coming Soon"
        ? "bg-gradient-to-r from-amber-500 to-orange-500"
        : "bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500",
    )}
  >
    {badge}
  </span>
);

const ExploreCard = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className="gradient-border-anim flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-4 text-center transition-colors hover:bg-accent"
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
  const { visible: promoBarVisible, dismiss: dismissPromoBar } = usePromoBar();

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
      {promoBarVisible && <PromoAnnouncementBar onDismiss={dismissPromoBar} />}
      {/* Non-fixed flow spacer matching the promo bar's h-9 — this is what actually
          pushes every page's <main> down by the bar's height. Editing each page's own
          pt-* class isn't needed: Header renders in place of <Header /> in each page's
          JSX, so this spacer's flow height applies right there, before <main>. */}
      {promoBarVisible && <div className="h-9" aria-hidden="true" />}
      <header
        className={cn(
          "fixed inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md",
          promoBarVisible ? "top-9" : "top-0",
        )}
      >
        <ScrollProgressBar />
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={closeMenu}>
            <img
              src="/logosvg.png"
              alt="SkinLabs"
              width={804}
              height={261}
              className="h-8 w-auto md:h-9 dark:hidden"
            />
            <img
              src="/logosvgwhite.png"
              alt="SkinLabs"
              width={804}
              height={261}
              className="hidden h-8 w-auto md:h-9 dark:block"
            />
          </Link>

          {/* Desktop Menu button (replaces individual primary links) */}
          <div className="hidden lg:flex items-center">
            <Popover open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gradient-border-anim rounded-full gap-1.5 border-transparent px-3 font-medium"
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
              className="gradient-border-anim hidden sm:inline-flex h-9 gap-2 rounded-full border-transparent px-3 text-muted-foreground hover:text-foreground"
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

            {/* SKYNN AI — animated multicolour gradient border, white bg, black text + Sparkles.
                Mobile gets a compact icon-only version next to the search icon; the full
                labelled pill takes over from sm: up, so the affordance is never fully hidden
                behind the hamburger menu on small screens. */}
            <Link
              to="/skynn-ai"
              aria-label="SKYNN AI — Skin Analysis"
              className="gradient-border-anim inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-sm transition-transform hover:scale-[1.05] active:scale-[0.98] sm:hidden"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/skynn-ai"
              className="gradient-border-anim hidden h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-black shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] sm:inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              SKYNN AI
            </Link>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gradient-border-anim hidden sm:inline-flex rounded-full border-transparent"
                  >
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

            {/* Theme toggle — desktop only; the mobile row is already tight (search,
                SKYNN AI, hamburger), so the mobile equivalent lives in the sheet header. */}
            <ThemeToggle className="hidden sm:inline-flex" />

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
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-lg font-bold">Menu</span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={closeMenu} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
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
              <Button
                variant="outline"
                className="gradient-border-anim w-full border-transparent"
                onClick={handleSignOut}
              >
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
                  className="gradient-border-anim w-full border-transparent"
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
