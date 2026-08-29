import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { type SpotlightBrandRanking, seededBrandLikes } from "@/data/spotlight";
import { useEngagementStore } from "@/stores/engagementStore";
import { cn } from "@/lib/utils";

const likeKey = (slug: string) => `spotlight:${slug}`;

interface SpotlightRankingCardProps {
  entry: SpotlightBrandRanking;
  /** Compact mode drops the reason/product-count line for tight homepage teasers. */
  compact?: boolean;
}

const SpotlightRankingCard = ({ entry, compact = false }: SpotlightRankingCardProps) => {
  const { likedIds, toggleLike } = useEngagementStore();
  const liked = likedIds.includes(likeKey(entry.slug));
  const likeCount = (seededBrandLikes[entry.slug] ?? 0) + (liked ? 1 : 0);

  return (
    <div className="rainbow-border-frame rounded-3xl p-[2px]">
      <div className="rainbow-border-content flex h-full flex-col rounded-3xl bg-card p-5">
      <div className="flex items-start gap-3">
        {entry.rank !== null ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {entry.rank}
          </span>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold uppercase text-accent-foreground">
            New
          </span>
        )}
        <BrandLogo brand={entry.brand} logoUrl={entry.editorial.logoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <Link to={`/spotlight/${entry.slug}`} className="font-heading text-base font-bold leading-snug text-foreground hover:underline">
            {entry.brand}
          </Link>
          <p className="text-xs text-muted-foreground">{entry.editorial.positioningStatement}</p>
        </div>
      </div>

      {!compact && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">{entry.editorial.knownFor}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{entry.avgOverallScore}/10 avg review score</span>
            <span>
              {entry.productCount} reviewed product{entry.productCount === 1 ? "" : "s"}
            </span>
          </div>
        </>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Link to={`/spotlight/${entry.slug}`} className="text-sm font-medium text-primary hover:underline">
          Read the profile →
        </Link>
        <button
          onClick={() => toggleLike(likeKey(entry.slug))}
          aria-label={`Like ${entry.brand}`}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Heart className={cn("h-3.5 w-3.5", liked && "fill-primary text-primary")} />
          {likeCount}
        </button>
      </div>
      </div>
    </div>
  );
};

export default SpotlightRankingCard;
