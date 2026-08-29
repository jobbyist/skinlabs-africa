import { useState } from "react";
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
 * Renders a brand logo when `logoUrl` is set; falls back to initials on error or missing URL.
 */
const BrandLogo = ({ brand, logoUrl, className, size = "md" }: BrandLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1",
          sizeClasses[size],
          className,
        )}
      >
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
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
