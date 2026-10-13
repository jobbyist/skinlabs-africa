/**
 * Concern-driven ingredient matrix (/ingredients): multi-select concerns + South African botanical relevance.
 * "SA relevance" is a curated name list (the `ingredients` table has no origin column), matched on INCI / common name /
 * slug, so it only ever flags botanicals we can name. Pure and tested.
 */
export interface MatrixIngredient {
  id: string;
  slug: string;
  inci_name: string | null;
  common_name: string | null;
}

/** Short chip labels for the DB's skin_concerns slugs. Unknown slugs fall back to the DB name. */
export const CONCERN_CHIP_LABELS: Record<string, string> = {
  hyperpigmentation: "Melasma / PIH",
  acne: "Acne & congestion",
  "sensitivity-barrier": "Barrier repair",
  aging: "Fine lines",
  dehydration: "Dehydration",
  dullness: "Dullness",
  "texture-scarring": "Texture & scarring",
};

/** Indigenous / South African-sourced botanicals, lower-case match fragments (INCI Latin names + common names). */
export const SA_BOTANICAL_TERMS: { label: string; terms: string[] }[] = [
  { label: "Rooibos", terms: ["rooibos", "aspalathus linearis"] },
  { label: "Marula", terms: ["marula", "sclerocarya birrea"] },
  { label: "Resurrection bush", terms: ["resurrection", "myrothamnus"] },
  { label: "Aloe ferox (Cape aloe)", terms: ["aloe ferox", "cape aloe", "bitter aloe"] },
  { label: "Baobab", terms: ["baobab", "adansonia"] },
  { label: "Buchu", terms: ["buchu", "agathosma", "barosma"] },
  { label: "Kigelia (sausage tree)", terms: ["kigelia", "sausage tree"] },
  { label: "Honeybush", terms: ["honeybush", "cyclopia"] },
  { label: "Kalahari melon", terms: ["kalahari melon", "tsamma"] },
  { label: "Mongongo / manketti", terms: ["mongongo", "manketti", "schinziophyton"] },
  { label: "Ximenia (sour plum)", terms: ["ximenia"] },
  { label: "Cape snowbush (wild rosemary)", terms: ["eriocephalus", "cape snowbush", "wild rosemary"] },
  { label: "African potato", terms: ["hypoxis", "african potato"] },
  { label: "Devil's claw", terms: ["harpagophytum", "devil's claw"] },
];

export const saBotanicalMatch = (ing: Pick<MatrixIngredient, "inci_name" | "common_name" | "slug">): string | null => {
  const hay = [ing.inci_name, ing.common_name, ing.slug.replace(/-/g, " ")].filter(Boolean).join(" ").toLowerCase();
  for (const group of SA_BOTANICAL_TERMS) if (group.terms.some((t) => hay.includes(t))) return group.label;
  return null;
};

export const isSouthAfricanBotanical = (ing: Pick<MatrixIngredient, "inci_name" | "common_name" | "slug">): boolean => saBotanicalMatch(ing) !== null;

/** `?concerns=a,b` → unique, trimmed slugs. */
export const parseConcernsParam = (value: string | null | undefined): string[] =>
  [...new Set((value ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z0-9-]{1,60}$/.test(s)))];

export const toggleConcern = (selected: string[], slug: string): string[] =>
  selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];

/** Union ("any of the selected concerns") by id, sorted by display name for a stable list. */
export const unionByName = <T extends MatrixIngredient>(lists: T[][]): T[] => {
  const byId = new Map<string, T>();
  for (const list of lists) for (const item of list) byId.set(item.id, item);
  const name = (i: T) => (i.common_name || i.inci_name || i.slug).toLowerCase();
  return [...byId.values()].sort((a, b) => name(a).localeCompare(name(b)));
};
