import { Link, useLocation } from "react-router-dom";
import { Home, Tag, LayoutGrid, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/marketplace" },
  { icon: Tag, label: "Brands", href: "/marketplace/brands" },
  { icon: LayoutGrid, label: "Categories", href: "/marketplace/categories" },
  { icon: Bookmark, label: "Saved", href: "/marketplace/saved" },
  { icon: User, label: "Account", href: "/dashboard" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = item.href === "/marketplace" ? pathname === "/marketplace" : pathname.startsWith(item.href);
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
