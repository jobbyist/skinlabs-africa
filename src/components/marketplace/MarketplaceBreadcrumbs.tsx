import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

interface MarketplaceBreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * OpenHaus breadcrumb trail. Always starts with OpenHaus home.
 * Current page is the last item without an href.
 */
export function MarketplaceBreadcrumbs({ items, className }: MarketplaceBreadcrumbsProps) {
  const trail: Crumb[] = [{ label: "OpenHaus", href: "/marketplace" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-stone-300" aria-hidden />}
              {isLast || !item.href ? (
                <span className="font-medium text-stone-800" aria-current="page">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Home className="h-3 w-3" aria-hidden /> {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-stone-800 hover:underline underline-offset-2">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Home className="h-3 w-3" aria-hidden /> {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
