/**
 * Homepage "Editorials" feature — the 3 Shelf Showdown comparison pieces SkinLabs is
 * putting in front of every visitor this cycle. Two live under /reviews/versus (the
 * newest Shelf Showdown instalments); one lives under /newsroom (an earlier original,
 * SEO-established piece) — same franchise, same standards, different publish date.
 */

export interface FeaturedEditorial {
  slug: string;
  href: string;
  title: string;
  dek: string;
  saContext: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
}

export const featuredEditorials: FeaturedEditorial[] = [
  {
    slug: "skin-functional-vs-skinphd-vitamin-c",
    href: "/reviews/versus/skin-functional-vs-skinphd-vitamin-c",
    title: "Skin Functional vs SkinPhD: Budget vs Clinic-Tier Vitamin C, Compared",
    dek: "A R270 pharmacy serum against a R660 clinic-brand one — we check whether the price gap actually buys more brightening.",
    saContext: "Budget vs Clinic-Tier",
    thumbnailUrl: "https://images.unsplash.com/photo-1640625696922-1fd63c0b97c9?auto=format&fit=crop&w=800&q=80",
    thumbnailAlt: "A vitamin C serum dropper bottle resting on fresh oranges",
  },
  {
    slug: "nimue-vs-optiphi-retinoid-serums",
    href: "/reviews/versus/nimue-vs-optiphi-retinoid-serums",
    title: "Nimue vs Optiphi: SA's Clinic-Brand Retinoids, Compared",
    dek: "Retinaldehyde against retinol-plus-peptides — two SA clinic brands, one very different retinoid strategy.",
    saContext: "Clinic-Grade Actives",
    thumbnailUrl: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=800&q=80",
    thumbnailAlt: "Two amber skincare serum bottles on a plain background",
  },
  {
    slug: "cerave-vs-cetaphil-sa-climate",
    href: "/newsroom/cerave-vs-cetaphil-sa-climate",
    title: "CeraVe vs Cetaphil in SA's Climate: Barrier Repair Compared",
    dek: "CeraVe's ceramide-and-MVE technology against Cetaphil's lighter approach — which barrier-repair line actually suits Highveld winters?",
    saContext: "Barrier Repair",
    thumbnailUrl: "https://images.unsplash.com/photo-1763503836825-97f5450d155a?auto=format&fit=crop&w=800&q=80",
    thumbnailAlt: "A jar of barrier-repair moisturiser cream on a neutral background",
  },
];
