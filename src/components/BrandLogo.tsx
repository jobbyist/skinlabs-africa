import { cn } from "@/lib/utils";

interface BrandLogoProps {
  brand: string;
  logoUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
};

const initialsFor = (brand: string) =>
  brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/**
 * Renders a brand's logo in monochrome once `logoUrl` is set (the user uploads
 * real assets later), falling back to a generated initials badge until then —
 * no invented or guessed logo artwork is used.
 */
const BrandLogo = ({ brand, logoUrl, className, size = "md" }: BrandLogoProps) => {
  if (logoUrl) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted", sizeClasses[size], className)}>
        <img src={logoUrl} alt={`${brand} logo`} className="h-full w-full object-contain grayscale" loading="lazy" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-muted font-heading font-bold text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {initialsFor(brand)}
    </span>
  );
};

export default BrandLogo;
