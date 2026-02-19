import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, Sparkles, User, LogOut, LayoutDashboard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CurrencyConverter from "@/components/CurrencyConverter";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/use-auth";
import { useCrossDomainAuth } from "@/hooks/use-cross-domain-auth";
import { toast } from "sonner";
import logo from "@/assets/newskinlabs.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { redirectToOpenhaus, loading: openhausLoading } = useCrossDomainAuth();

  const navLinks = [
    { label: "Products", href: "/products" },
    { label: "AI Formulator", href: "/ai-formulator" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
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
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <CurrencyConverter />
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  0
                </span>
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
            <div className="md:hidden flex items-center gap-1">
              <CurrencyConverter />
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
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
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
    </>
  );
};

export default Header;
