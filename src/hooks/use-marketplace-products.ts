import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceProductRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  markedUpPriceZar: number;
  originalPriceZar: number;
  category: string;
  concern: string[];
  values: string[];
  skinToneClaims: string[];
  size: string | null;
  howToUse: string | null;
  keyActives: string[];
  inStock: boolean;
  brand: { id: string; slug: string; name: string; origin: string | null; coverImagePath: string | null };
  images: { url: string; alt: string | null; isPrimary: boolean; position: number }[];
  externalRating: { rating: number | null; reviewCount: number | null; sourceUrl: string } | null;
}

async function fetchMarketplaceProducts(): Promise<MarketplaceProductRecord[]> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .select(
      `
      id, slug, name, description, marked_up_price_zar, original_price_zar, category,
      concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock,
      brand:marketplace_brands ( id, slug, name, origin, cover_image_path ),
      images:marketplace_product_images ( url, alt, is_primary, position ),
      external_rating:marketplace_product_ratings ( rating, review_count, source_url )
    `,
    )
    .eq("in_stock", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row): MarketplaceProductRecord => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    markedUpPriceZar: Number(row.marked_up_price_zar),
    originalPriceZar: Number(row.original_price_zar),
    category: row.category,
    concern: row.concern ?? [],
    values: row.values ?? [],
    skinToneClaims: row.skin_tone_claims ?? [],
    size: row.size,
    howToUse: row.how_to_use,
    keyActives: row.key_actives ?? [],
    inStock: row.in_stock,
    brand: row.brand
      ? {
          id: row.brand.id,
          slug: row.brand.slug,
          name: row.brand.name,
          origin: row.brand.origin,
          coverImagePath: row.brand.cover_image_path,
        }
      : { id: "", slug: "", name: "", origin: null, coverImagePath: null },
    images: (row.images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ url: img.url, alt: img.alt, isPrimary: img.is_primary, position: img.position })),
    externalRating: row.external_rating
      ? {
          rating: row.external_rating.rating === null ? null : Number(row.external_rating.rating),
          reviewCount: row.external_rating.review_count,
          sourceUrl: row.external_rating.source_url,
        }
      : null,
  }));
}

/** All active marketplace products, joined with brand/images/external rating — fetched once and cached (small dataset, ~84 rows). */
export function useMarketplaceProducts() {
  return useQuery({
    queryKey: ["marketplace-products"],
    queryFn: fetchMarketplaceProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplaceProduct(slug: string | undefined) {
  const query = useMarketplaceProducts();
  return {
    ...query,
    data: slug ? query.data?.find((p) => p.slug === slug) : undefined,
  };
}

export interface MarketplaceBrandRecord {
  id: string;
  slug: string;
  name: string;
  origin: string | null;
  description: string | null;
  coverImagePath: string | null;
  values: string[];
}

async function fetchMarketplaceBrands(): Promise<MarketplaceBrandRecord[]> {
  const { data, error } = await supabase
    .from("marketplace_brands")
    .select("id, slug, name, origin, description, cover_image_path, values")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    origin: row.origin,
    description: row.description,
    coverImagePath: row.cover_image_path,
    values: row.values ?? [],
  }));
}

export function useMarketplaceBrands() {
  return useQuery({
    queryKey: ["marketplace-brands"],
    queryFn: fetchMarketplaceBrands,
    staleTime: 5 * 60 * 1000,
  });
}
