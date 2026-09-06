import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ExternalLink,
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
  UserPlus,
  ChevronDown,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  badge?: "NEW" | "BETA" | "Coming Soon";
}

/** Primary destinations — shown first, both in the mobile panel and the desktop bar. */
const primaryLinks: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Routines", href: "/routines", icon: Target, badge: "Coming Soon" },
  { label: "AI Formulator", href: "/ai-formulator", icon: FlaskConical, badge: "BETA" },
  { label: "Business Suite", href: "/business", icon: TrendingUp, badge: "NEW" },
];

/** The "Explore" grid — SkinLabs' editorial + platform sections. */
const exploreLinks: NavItem[] = [
  { label: "Briefings", href: "/briefings", icon: Newspaper },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Consult", href: "/consultations", icon: Calendar },
  { label: "Find a Dermatologist", href: "/consult", icon: Stethoscope, badge: "NEW" },
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
    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border px-3 py-5 text-center transition-colors hover:bg-accent"
  >
    <item.icon className="h-5 w-5 text-foreground" aria-hidden />
    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">{item.label}</span>
    {item.badge && <NavBadge badge={item.badge} />}
  </Link>
);

const ResourceRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className="flex items-center justify-between rounded-xl px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
  >
    <span className="flex items-center gap-3">
      <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      {item.label}
    </span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
  </Link>
);

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { redirectToOpenhaus, loading: openhausLoading } = useCrossDomainAuth();

  const closeMenu = () => setIsMenuOpen(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="SKINLABS" className="w-[120px] h-auto" />
            </Link>

            {/* Desktop / tablet nav — mirrors the mobile panel's IA: primary
                destinations plus an Explore mega-menu for editorial sections. */}
            <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
              {primaryLinks
                .filter((link) => link.href !== "/")
                .map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    {link.badge && <NavBadge badge={link.badge} />}
                  </Link>
                ))}

              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-auto rounded-full bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground">
                      <Compass className="mr-1.5 h-4 w-4" />
                      Explore
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[560px] grid-cols-4 gap-2 p-4">
                        {exploreLinks.map((item) => (
                          <NavigationMenuLink key={item.label} asChild>
                            <ExploreCard item={item} />
                          </NavigationMenuLink>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-1 border-t border-border p-3">
                        {resourceLinks.map((item) => (
                          <NavigationMenuLink key={item.label} asChild>
                            <Link
                              to={item.href}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <item.icon className="h-3.5 w-3.5" aria-hidden />
                              {item.label}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link
                to="/partners"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <UserPlus className="h-4 w-4" />
                Partner Program
              </Link>
            </nav>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search SkinLabs"
                className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                <span className="hidden xl:inline">Search</span>
                <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium xl:inline">⌘K</kbd>
              </button>
              {!loading && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full w-9 h-9 text-sm font-semibold">
                      {userInitial}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={redirectToOpenhaus} disabled={openhausLoading} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {openhausLoading ? "Connecting..." : "OpenHaus Market"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="default" className="gap-2" onClick={() => setAuthOpen(true)}>
                  <LogIn className="h-4 w-4" />
                  Log In / Sign Up
                </Button>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-1">
              <button className="p-2" onClick={() => setSearchOpen(true)} aria-label="Search SkinLabs">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / tablet slide-out menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-sm [&>button]:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
              <img src={logo} alt="SKINLABS" className="h-6 w-auto" />
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-muted-foreground">
                Beta
              </span>
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="Primary" className="flex flex-col gap-1 px-3 py-3">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-3">
                  <link.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  {link.label}
                </span>
                {link.badge && <NavBadge badge={link.badge} />}
              </Link>
            ))}
          </nav>

          <div className="px-3">
            <div className="border-t border-border" />
          </div>

          <Collapsible open={exploreOpen} onOpenChange={setExploreOpen} className="px-3 py-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Explore
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", exploreOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 grid grid-cols-2 gap-3 px-1">
              {exploreLinks.map((item) => (
                <ExploreCard key={item.label} item={item} onClick={closeMenu} />
              ))}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-col gap-0.5 px-3 pb-3">
            {resourceLinks.map((item) => (
              <ResourceRow key={item.label} item={item} onClick={closeMenu} />
            ))}
          </div>

          <div className="px-3">
            <div className="border-t border-border" />
          </div>

          <div className="flex flex-col gap-0.5 px-3 py-3">
            <Link
              to="/partners"
              onClick={closeMenu}
              className="flex items-center justify-between rounded-xl px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden />
                Partner Program
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                Work With Us
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {!loading && user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    closeMenu();
                  }}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthOpen(true);
                  closeMenu();
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <LogIn className="h-4 w-4 text-muted-foreground" />
                Sign Up / Log In
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
