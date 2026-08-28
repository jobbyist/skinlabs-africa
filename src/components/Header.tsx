import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sparkles, User, LogOut, LayoutDashboard, ExternalLink, Newspaper, Star, Mic, Calendar, DollarSign, Search, Award, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AuthDialog from "@/components/AuthDialog";
import SiteSearch from "@/components/SiteSearch";
import { useAuth } from "@/hooks/use-auth";
import { useCrossDomainAuth } from "@/hooks/use-cross-domain-auth";
import { toast } from "sonner";
import logo from "@/assets/newskinlabs.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { redirectToOpenhaus, loading: openhausLoading } = useCrossDomainAuth();

  const navLinks = [
    { label: "Briefings", href: "/newsroom", icon: Newspaper },
    { label: "Reviews", href: "/reviews", icon: Star },
    { label: "Spotlight", href: "/spotlight", icon: Award, isNew: true },
    { label: "Seasonals", href: "/seasonals", icon: Sun, isNew: true },
    { label: "Podcast", href: "/podcast", icon: Mic },
    { label: "Consultations", href: "/consultations", icon: Calendar },
    { label: "Pricing", href: "/pricing", icon: DollarSign },
  ];

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
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="SKINLABS" className="w-[120px] h-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.isNew && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-foreground">
                      New
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
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
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/ai-formulator">
                  <Sparkles className="h-4 w-4" />
                  Build My AI Routine
                </Link>
              </Button>
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
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                className="p-2"
                onClick={() => setSearchOpen(true)}
                aria-label="Search SkinLabs"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                className="p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    {link.isNew && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-foreground">
                        New
                      </span>
                    )}
                  </Link>
                ))}
                {!loading && user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Button variant="outline" className="w-full gap-2 mt-2" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button variant="default" className="w-full gap-2 mt-2" onClick={() => { setAuthOpen(true); setIsMenuOpen(false); }}>
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Header;
