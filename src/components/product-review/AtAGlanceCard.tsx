import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, MapPin, Clock, Tag, ShoppingBag } from "lucide-react";

interface AtAGlanceCardProps {
  /** Brand name */
  brand: string;
  /** Product name */
  productName: string;
  /** Product category */
  category: string;
  /** Product size/volume (e.g., "50ml", "30ml x 2") */
  size?: string;
  /** Price in ZAR */
  priceZAR: number;
  /** Where the product is available */
  whereAvailable: string;
  /** Country of manufacture/origin */
  countryOfOrigin?: string;
  /** AM/PM/Both usage recommendation */
  amPmUsage?: "AM" | "PM" | "Both" | string;
}

/**
 * At-a-Glance Card component for product review pages.
 * Displays key product facts in a scannable format.
 * Helps users quickly understand product basics before diving into the full review.
 */
export function AtAGlanceCard({
  brand,
  productName,
  category,
  size,
  priceZAR,
  whereAvailable,
  countryOfOrigin,
  amPmUsage,
}: AtAGlanceCardProps) {
  const facts = [
    {
      icon: Tag,
      label: "Category",
      value: category,
    },
    ...(size
      ? [
          {
            icon: Package,
            label: "Size",
            value: size,
          },
        ]
      : []),
    {
      icon: DollarSign,
      label: "Price",
      value: `R${priceZAR.toFixed(2)} ZAR`,
    },
    {
      icon: ShoppingBag,
      label: "Available",
      value: whereAvailable,
    },
    ...(countryOfOrigin
      ? [
          {
            icon: MapPin,
            label: "Origin",
            value: countryOfOrigin,
          },
        ]
      : []),
    ...(amPmUsage
      ? [
          {
            icon: Clock,
            label: "Usage",
            value: amPmUsage,
          },
        ]
      : []),
  ];

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">At a Glance</h2>
      <div className="space-y-3">
        {facts.map((fact) => {
          const Icon = fact.icon;
          return (
            <div key={fact.label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
                <dd className="text-sm font-semibold">{fact.value}</dd>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
        Product information accurate as of review date. Prices and availability may vary.
      </p>
    </Card>
  );
}
