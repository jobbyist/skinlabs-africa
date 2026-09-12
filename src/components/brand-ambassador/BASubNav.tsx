import ApplyCTAButton from "./ApplyCTAButton";
import type { ApplicationWindowStatus } from "@/data/brandAmbassador";

interface BASubNavProps {
  onApply: () => void;
  status: ApplicationWindowStatus;
}

const links = [
  { href: "#programme", label: "Programme" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#commission", label: "Commission" },
  { href: "#performance-opportunity", label: "Performance Opportunity" },
  { href: "#faq", label: "FAQ" },
];

const BASubNav = ({ onApply, status }: BASubNavProps) => {
  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur md:top-20">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
        <nav aria-label="Brand Ambassador Programme sections" className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <ApplyCTAButton status={status} onApply={onApply} size="sm" className="shrink-0" />
      </div>
    </div>
  );
};

export default BASubNav;
