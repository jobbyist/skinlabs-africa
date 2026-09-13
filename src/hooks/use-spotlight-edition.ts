import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION } from "@/data/spotlight";

export interface SpotlightEdition {
  editionLabel: string;
  methodologyVersion: string;
  reviewCountAtSnapshot: number;
}

/** Static fallback for the current live edition -- what every page showed before this
 *  table existed, and what still renders instantly while the live row is loading. */
const FALLBACK: SpotlightEdition = {
  editionLabel: SPOTLIGHT_EDITION_MONTH,
  methodologyVersion: SPOTLIGHT_METHODOLOGY_VERSION,
  reviewCountAtSnapshot: 160,
};

async function fetchCurrentEdition(): Promise<SpotlightEdition> {
  const { data, error } = await supabase
    .from("spotlight_editions")
    .select("edition_label, methodology_version, review_count_at_snapshot")
    .eq("is_current", true)
    .maybeSingle();

  if (error || !data) return FALLBACK;

  return {
    editionLabel: data.edition_label,
    methodologyVersion: data.methodology_version,
    reviewCountAtSnapshot: data.review_count_at_snapshot,
  };
}

/** The current Spotlight edition label + methodology version, mechanically bumped by
 *  the product-review pipeline every 25 published reviews (see api/product-review-sync.ts).
 *  Falls back to the static constants in src/data/spotlight.ts if the table is
 *  unreachable, so Spotlight never blanks or shows stale-looking placeholder text. */
export function useSpotlightEdition() {
  const query = useQuery({
    queryKey: ["spotlight-current-edition"],
    queryFn: fetchCurrentEdition,
    staleTime: 5 * 60 * 1000,
  });
  return { ...query, data: query.data ?? FALLBACK };
}

export interface SpotlightArchiveEntry extends SpotlightEdition {
  id: string;
  isCurrent: boolean;
  createdAt: string;
}

async function fetchAllEditions(): Promise<SpotlightArchiveEntry[]> {
  const { data, error } = await supabase
    .from("spotlight_editions")
    .select("id, edition_label, methodology_version, review_count_at_snapshot, is_current, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    editionLabel: row.edition_label,
    methodologyVersion: row.methodology_version,
    reviewCountAtSnapshot: row.review_count_at_snapshot,
    isCurrent: row.is_current,
    createdAt: row.created_at,
  }));
}

/** Every Spotlight edition ever recorded, newest first -- backs the real archive
 *  trail SpotlightArchive.tsx promised once editions started being tracked. */
export function useSpotlightEditionArchive() {
  return useQuery({
    queryKey: ["spotlight-edition-archive"],
    queryFn: fetchAllEditions,
    staleTime: 5 * 60 * 1000,
  });
}
