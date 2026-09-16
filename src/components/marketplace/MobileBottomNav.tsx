import { Link, useLocation } from "react-router-dom";
import { Home, Tag, LayoutGrid, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/marketplace", match: "/marketplace" },
  { icon: Tag, label: "Brands", href: "/marketplace/brands", match: "/marketplace/brands" },
  { icon: LayoutGrid, label: "Categories", href: "/marketplace/categories", match: "/marketplace/categories" },
  { icon: Bookmark, label: "Saved", href: "/marketplace/saved", match: "/marketplace/saved" },
  { icon: User, label: "Account", href: "/dashboard?tab=account", match: "/dashboard" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Marketplace"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const active =
            item.match === "/marketplace"
              ? pathname === "/marketplace"
              : pathname.startsWith(item.match);
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                active ? "text-stone-900" : "text-stone-400 hover:text-stone-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
