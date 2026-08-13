import { brandLogos, retailerLogos } from "@/lib/brandAssets";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  name: string;
  type: "brand" | "retailer";
  className?: string;
}

/** Renders a real brand/retailer logo when we have one, else a clean text-initial fallback badge. */
const BrandMark = ({ name, type, className }: BrandMarkProps) => {
  const logo = (type === "brand" ? brandLogos : retailerLogos)[name];

  if (logo) {
    return (
      <span className="inline-flex items-center">
        <img
          src={logo}
          alt={`${name} logo`}
          className={cn("h-full w-auto max-w-full object-contain", className)}
          loading="lazy"
        />
        {/* Keep the brand/retailer name as real, crawlable text alongside the logo image. */}
        <span className="sr-only">{name}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {name}
    </span>
  );
};

export default BrandMark;
