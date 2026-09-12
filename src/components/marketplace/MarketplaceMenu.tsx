import { Link } from "react-router-dom";
import { X, Grid3x3, Sparkles, Tag, Heart, Palette, Home as HomeIcon, LayoutDashboard } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { categories, concerns, values, skinTones } from "@/data/marketplace/taxonomy";
import { OpenHausLogo } from "./OpenHausLogo";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Grid3x3;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function MarketplaceMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-sm [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <Link to="/marketplace" onClick={close}>
            <OpenHausLogo />
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Link
          to="/marketplace"
          onClick={close}
          className="mx-3 mt-3 flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-50"
        >
          <HomeIcon className="h-4 w-4 text-stone-500" /> OpenHaus Home
        </Link>

        <Section title="Shop by category" icon={Grid3x3}>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/marketplace/categories?category=${cat.slug}`}
                onClick={close}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-stone-200 px-3 py-4 text-center hover:bg-stone-50"
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium text-stone-800">{cat.label}</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Shop by concern" icon={Sparkles}>
          <div className="flex flex-col gap-0.5">
            {concerns.map((c) => (
              <Link
                key={c.slug}
                to={`/marketplace/concern/${c.slug}`}
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
              >
                <span>{c.icon}</span> {c.label}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Shop by brand" icon={Tag}>
          <Link
            to="/marketplace/brands"
            onClick={close}
            className="flex items-center justify-between rounded-xl px-2 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            View all brands
          </Link>
        </Section>

        <Section title="Shop by values" icon={Heart}>
          <div className="flex flex-wrap gap-1.5 px-1">
            {values.map((v) => (
              <Link
                key={v.slug}
                to={`/marketplace/values/${v.slug}`}
                onClick={close}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                {v.icon} {v.label}
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Shop by skin tone" icon={Palette}>
          <div className="flex flex-wrap gap-1.5 px-1">
            {skinTones.map((t) => (
              <Link
                key={t.slug}
                to={`/marketplace/skin-tone/${t.slug}`}
                onClick={close}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </Section>

        <div className="px-3">
          <div className="border-t border-stone-100" />
        </div>

        <Link
          to="/dashboard"
          onClick={close}
          className="mx-3 my-3 flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          <LayoutDashboard className="h-4 w-4 text-stone-500" /> My account
        </Link>
      </SheetContent>
    </Sheet>
  );
}
