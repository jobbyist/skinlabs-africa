import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Sparkles, LogOut, LayoutDashboard, ExternalLink, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/use-auth";
import { useCrossDomainAuth } from "@/hooks/use-cross-domain-auth";
import { toast } from "sonner";
import logo from "@/assets/newskinlabs.png";

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading, isAnonymous, signOut } = useAuth();
  const { redirectToOpenhaus, loading: openhausLoading } = useCrossDomainAuth();

  const navLinks = [
    { label: t("header.navAiFormulator"), href: "/ai-formulator" },
    { label: t("header.navNewsroom"), href: "/newsroom" },
    { label: t("header.navPodcast"), href: "/podcast" },
    { label: t("header.navReviews"), href: "/reviews" },
    { label: t("header.navConsultation"), href: "/book-consultation" },
    { label: t("header.navPricing"), href: "/pricing" },
  ];

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === "af" ? "en" : "af");
  };

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
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                aria-label="Switch language"
                className="hidden items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold uppercase text-foreground hover:bg-secondary xl:inline-flex"
              >
                <Languages className="h-3.5 w-3.5" />
                {i18n.language === "af" ? "EN" : "AF"}
              </button>
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground xl:inline-flex">
                {t("header.zaBadge")}
              </span>
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                <Link to="/ai-formulator">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden xl:inline">{t("header.ctaFull")}</span>
                  <span className="xl:hidden">{t("header.ctaShort")}</span>
                </Link>
              </Button>
              {!loading && user && !isAnonymous ? (
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
                        {t("header.dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={redirectToOpenhaus} disabled={openhausLoading} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {openhausLoading ? "Connecting..." : t("header.openhausMarket")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      {t("header.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" className="gap-2" onClick={() => setAuthOpen(true)}>
                  {t("header.signIn")}
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-1">
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
                    key={link.href}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <Button size="lg" className="w-full gap-2 mt-2" asChild onClick={() => setIsMenuOpen(false)}>
                  <Link to="/ai-formulator">
                    <Sparkles className="h-4 w-4" />
                    {t("header.ctaFull")}
                  </Link>
                </Button>

                <div className="flex items-center gap-2">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                    {t("header.zaBadge")}
                  </span>
                  <button
                    onClick={toggleLanguage}
                    aria-label="Switch language"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold uppercase text-foreground hover:bg-secondary"
                  >
                    <Languages className="h-3.5 w-3.5" />
                    {i18n.language === "af" ? "EN" : "AF"}
                  </button>
                </div>

                {!loading && user && !isAnonymous ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t("header.dashboard")}
                    </Link>
                    <Button variant="outline" className="w-full gap-2" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                      <LogOut className="h-4 w-4" />
                      {t("header.signOut")}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setAuthOpen(true); setIsMenuOpen(false); }}>
                    {t("header.signIn")}
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
