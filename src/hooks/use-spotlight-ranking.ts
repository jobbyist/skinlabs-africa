import { useMemo } from "react";
import { productReviews } from "@/data/reviews";
import {
  computeSpotlightRanking,
  computeSpotlightTopThisWeek,
  spotlightRanking as staticRanking,
  spotlightRisingBrands as staticRising,
  spotlightRankedBrands as staticRanked,
  spotlightTopThisWeek as staticTop,
  type SpotlightBrandRanking,
} from "@/data/spotlight";
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";

export interface SpotlightRankingData {
  /** Ranked brands first, then New on the Radar. */
  all: SpotlightBrandRanking[];
  /** Brands with two or more published reviews. */
  ranked: SpotlightBrandRanking[];
  /** Brands with exactly one published review. */
  radar: SpotlightBrandRanking[];
  topThisWeek: SpotlightBrandRanking[];
  /** True once the pipeline-generated reviews are included (until then the static catalogue is shown). */
  includesGenerated: boolean;
  /** True while the generated reviews are still loading (a derived brand's slug is not resolvable yet). */
  loading: boolean;
}

/**
 * The live Spotlight ranking: the static catalogue merged with every published pipeline-generated review, so a brand
 * is ranked as soon as it has two published reviews, wherever they came from. Renders the static ranking immediately
 * and swaps in the merged one when the generated reviews arrive.
 */
export function useSpotlightRanking(): SpotlightRankingData {
  const { data: generated, isLoading } = useGeneratedReviews();
  return useMemo(() => {
    if (!generated || generated.length === 0) {
      return { all: staticRanking, ranked: staticRanked, radar: staticRising, topThisWeek: staticTop, includesGenerated: false, loading: isLoading };
    }
    const all = computeSpotlightRanking([...productReviews, ...generated]);
    const ranked = all.filter((entry) => entry.tier === "ranked");
    return {
      all,
      ranked,
      radar: all.filter((entry) => entry.tier === "new-on-the-radar"),
      topThisWeek: computeSpotlightTopThisWeek(ranked),
      includesGenerated: true,
      loading: false,
    };
  }, [generated, isLoading]);
}
