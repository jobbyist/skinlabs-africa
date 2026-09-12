/**
 * Fixed OpenHaus browse taxonomy. `label` values here are exactly what's
 * stored in marketplace_products.concern/values/skin_tone_claims (the
 * seeding tagging pass used this same fixed vocabulary) — slugs are only
 * for routing, filtering always matches on `label`.
 */

export interface TaxonomyEntry {
  slug: string;
  label: string;
  icon?: string;
}

export const categories: TaxonomyEntry[] = [
  { slug: "face", label: "Face", icon: "👤" },
  { slug: "body", label: "Body", icon: "🧴" },
  { slug: "hair-scalp", label: "Hair & Scalp", icon: "💆" },
  { slug: "sun-care", label: "Sun Care", icon: "☀️" },
  { slug: "treatments", label: "Treatments", icon: "💧" },
  { slug: "tools", label: "Tools", icon: "🖌️" },
];

export const concerns: TaxonomyEntry[] = [
  { slug: "acne-breakouts", label: "Acne & Breakouts", icon: "🌿" },
  { slug: "hyperpigmentation", label: "Hyperpigmentation", icon: "✨" },
  { slug: "dry-dehydrated", label: "Dry & Dehydrated", icon: "💧" },
  { slug: "sensitive-skin", label: "Sensitive Skin", icon: "🩹" },
  { slug: "fine-lines-ageing", label: "Fine Lines & Ageing", icon: "⏳" },
  { slug: "dark-circles-puffiness", label: "Dark Circles & Puffiness", icon: "👁️" },
  { slug: "dandruff-scalp", label: "Dandruff & Scalp", icon: "💆" },
];

export const values: TaxonomyEntry[] = [
  { slug: "cruelty-free", label: "Cruelty-Free", icon: "🐇" },
  { slug: "vegan", label: "Vegan", icon: "🌱" },
  { slug: "pregnancy-safe", label: "Pregnancy-Safe", icon: "🤰" },
  { slug: "reef-safe", label: "Reef-Safe", icon: "🐠" },
  { slug: "fragrance-free", label: "Fragrance-Free", icon: "🚫" },
  { slug: "sa-woman-owned", label: "SA Woman-Owned", icon: "🇿🇦" },
];

export const skinTones: TaxonomyEntry[] = [{ slug: "all-skin-tones", label: "All Skin Tones", icon: "🎨" }];

export function findByLabel(entries: TaxonomyEntry[], label: string) {
  return entries.find((e) => e.label === label);
}

export function findBySlug(entries: TaxonomyEntry[], slug: string) {
  return entries.find((e) => e.slug === slug);
}
