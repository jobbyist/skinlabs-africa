import { cn } from "@/lib/utils";

interface SectionNavProps {
  /** Accessible name for the group, e.g. "My Skin". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}

/** Second-level navigation inside a dashboard group (My Skin, Settings). */
const SectionNav = ({ label, value, onChange, items }: SectionNavProps) => (
  <nav aria-label={`${label} sections`} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => onChange(item.value)}
          className={cn(
            "min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      );
    })}
  </nav>
);

export default SectionNav;
