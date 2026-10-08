import { MapPin, ExternalLink, TrendingDown } from "lucide-react";
import { trackConversionEvent } from "@/lib/analytics-events";
import { checkedLabel, formatRand, formatSize, groupPrices, stockLabel, type SaRetailPrice } from "@/lib/pricing/saRetailPrices";
import type { ReviewTimeSnapshot } from "@/lib/pricing/editorialPrices";
import { isLowestIn30Days, statKey, type PriceStat } from "@/lib/pricing/priceTracking";
import { cn } from "@/lib/utils";

interface SaPricesPanelProps {
  /** Live, matched prices (view sa_retail_prices). */
  rows: SaRetailPrice[];
  /** A dated snapshot from the review itself, shown only when there are no live rows. */
  snapshot?: ReviewTimeSnapshot | null;
  /** 30-day price stats per listing (RPC sa_price_stats_30d), keyed by retailer|url. Drives the "Lowest in 30 days" badge. */
  stats?: Map<string, PriceStat>;
  className?: string;
}

/**
 * "Where to buy in South Africa". Live rows come from each retailer's own product page,
 * read by the price sync and shown with when they were checked. With no live rows, a
 * dated review-time snapshot may appear, worded as such; with neither, nothing renders
 * (an invented or stale price is worse than none).
 */
const SaPricesPanel = ({ rows, snapshot, stats, className }: SaPricesPanelProps) => {
  if (rows.length === 0 && !snapshot) return null;

  if (rows.length === 0 && snapshot) {
    const date = new Date(snapshot.asOf).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    return (
      <section className={cn("mt-8", className)} aria-labelledby="where-to-buy-heading">
        <h2 id="where-to-buy-heading" className="mb-2 font-heading text-lg font-bold text-foreground">
          Where to buy in South Africa
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          {snapshot.rows.map((row, i) => (
            <a
              key={row.retailer}
              href={row.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent", i > 0 && "border-t border-border")}
            >
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {row.retailer}
              </span>
              <span className="font-semibold text-foreground">{formatRand(row.price_zar)}</span>
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Prices as noted when we reviewed this product on {date}. They are not live. Check the retailer for today's price and stock.
        </p>
      </section>
    );
  }

  const groups = groupPrices(rows);
  const now = new Date();
  const hasTakealot = rows.some((r) => r.retailer_slug === "takealot");

  return (
    <section className={cn("mt-8", className)} aria-labelledby="where-to-buy-heading">
      <h2 id="where-to-buy-heading" className="mb-2 font-heading text-lg font-bold text-foreground">
        Where to buy in South Africa
      </h2>
      <div className="space-y-4">
        {groups.map((group) => {
          const size = formatSize(group.sizeMl);
          return (
            <div key={group.sizeMl ?? "unknown"}>
              {(groups.length > 1 || size) && (
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {size ?? "Pack size not stated"}
                </h3>
              )}
              <div className="overflow-hidden rounded-2xl border border-border">
                {group.rows.map((row, i) => {
                  const stock = stockLabel(row.in_stock);
                  const lowest = isLowestIn30Days(stats?.get(statKey(row.retailer_slug, row.listing_url)), row.price_zar, now);
                  return (
                    <a
                      key={row.retailer_slug}
                      href={row.listing_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={() => trackConversionEvent("sa_price_link_clicked", { retailer: row.retailer_slug, product: row.product_slug })}
                      className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent", i > 0 && "border-t border-border")}
                    >
                      <span className="min-w-0">
                        <span className="inline-flex items-center gap-2 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> {row.retailer_name}
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {lowest && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                              <TrendingDown className="h-3 w-3" aria-hidden="true" /> Lowest in 30 days
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {checkedLabel(new Date(row.checked_at), now)}
                          {stock ? ` · ${stock}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">{formatRand(row.price_zar)}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Prices are read automatically from each retailer's own product page and change often. Pack sizes can differ between listings; check the retailer before you buy.
        {hasTakealot ? " Takealot listings may be sold by third-party sellers." : ""}
      </p>
    </section>
  );
};

export default SaPricesPanel;
