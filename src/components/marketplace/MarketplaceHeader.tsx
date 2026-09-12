import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShoppingBag, Menu } from "lucide-react";
import { OpenHausLogo } from "./OpenHausLogo";
import { MarketplaceSearch } from "./MarketplaceSearch";
import { MarketplaceMenu } from "./MarketplaceMenu";
import { CartDrawer } from "./CartDrawer";
import { CurrencySelector } from "./CurrencySelector";
import { useCart } from "@/contexts/CartContext";

/**
 * Shared header for every OpenHaus page — search is scoped to marketplace
 * products only, cart opens a real drawer backed by CartContext, menu opens
 * a Sheet mirroring the main site's Header.tsx UI/UX, adapted to marketplace
 * browsing (category/concern/brand/values/skin-tone) instead of editorial nav.
 */
export function MarketplaceHeader({ showBack = false }: { showBack?: boolean }) {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16 max-w-lg lg:max-w-6xl mx-auto">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-stone-700" />
            </button>
          ) : (
            <Link to="/marketplace" className="flex items-center gap-2 min-w-0">
              <OpenHausLogo />
            </Link>
          )}

          <div className="flex items-center gap-2">
            <CurrencySelector className="hidden sm:flex h-8 w-[76px] text-[11px] rounded-full border-stone-200" />
            <button
              aria-label="Search OpenHaus products"
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-stone-700" />
            </button>
            <button
              aria-label="Open your bag"
              className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5 text-stone-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-stone-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              aria-label="Open menu"
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-stone-700" />
            </button>
          </div>
        </div>
      </header>

      <MarketplaceSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <MarketplaceMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
