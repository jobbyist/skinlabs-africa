/**
 * "My Skincare Shelf": open-bottle tracking with Period-After-Opening (PAO), oxidation warnings for unstable actives and a
 * run-out estimate from how often the member actually uses the product. General cosmetic-use guidance only: the brand's own
 * PAO and expiry date always win, and nothing here is a safety or medical claim. Pure and tested.
 */
export const PAO_OPTIONS = [3, 6, 9, 12, 18, 24, 36] as const;

export type ShelfCategory = "cleanser" | "toner" | "serum" | "moisturiser" | "sunscreen" | "treatment" | "mask" | "other";
export const SHELF_CATEGORIES: { value: ShelfCategory; label: string }[] = [
  { value: "cleanser", label: "Cleanser" },
  { value: "toner", label: "Toner / essence" },
  { value: "serum", label: "Serum" },
  { value: "moisturiser", label: "Moisturiser" },
  { value: "sunscreen", label: "Sunscreen" },
  { value: "treatment", label: "Treatment / spot" },
  { value: "mask", label: "Mask" },
  { value: "other", label: "Other" },
];

/** Rough amount per application (ml). Editable per bottle; these only seed the estimate. */
export const DEFAULT_ML_PER_USE: Record<ShelfCategory, number> = {
  cleanser: 2,
  toner: 1.5,
  serum: 0.5,
  moisturiser: 1,
  sunscreen: 1.5,
  treatment: 0.3,
  mask: 5,
  other: 1,
};

export type ActiveTag = "vitamin_c" | "retinoid" | "benzoyl_peroxide";

export interface ActiveGuidance {
  label: string;
  /** A typical conservative window (months) for this kind of formula once opened. */
  typicalMonths: number;
  warning: string;
  sign: string;
}

export const UNSTABLE_ACTIVES: Record<ActiveTag, ActiveGuidance> = {
  vitamin_c: {
    label: "Vitamin C (L-ascorbic acid)",
    typicalMonths: 3,
    warning: "L-ascorbic acid oxidises with air and light, so it loses strength as the bottle ages. Close the cap tightly and keep it out of light and heat.",
    sign: "A serum that has turned orange or dark brown (or smells metallic) has oxidised: replace it rather than push on.",
  },
  retinoid: {
    label: "Retinol / retinoid",
    typicalMonths: 6,
    warning: "Retinol breaks down with light, air and heat, so an old bottle gets weaker. Airless pumps and opaque tubes hold up best; keep it closed and cool.",
    sign: "A changed smell, colour or texture, or results fading, are signs it is past its best.",
  },
  benzoyl_peroxide: {
    label: "Benzoyl peroxide",
    typicalMonths: 6,
    warning: "Benzoyl peroxide loses strength over time and can bleach fabric. Store it closed and away from heat.",
    sign: "Separation, a changed smell or a gritty texture means it is time for a fresh one.",
  },
};

/** Suggest actives from a product name. Suggestions only: the member confirms. Ascorbyl derivatives are stable, so they don't match. */
export const detectActives = (name: string): ActiveTag[] => {
  const n = name.toLowerCase();
  const out: ActiveTag[] = [];
  const derivative = /ascorbyl|ascorbate|glucoside|tetrahexyldecyl|\bsap\b|\bmap\b/.test(n);
  if (!derivative && /(l-)?ascorbic|vitamin\s?c|vit\.?\s?c\b/.test(n)) out.push("vitamin_c");
  if (/retinol|retinal|retinaldehyde|retinoid|tretinoin|adapalene|retinyl/.test(n)) out.push("retinoid");
  if (/benzoyl\s?peroxide|\bbpo\b/.test(n)) out.push("benzoyl_peroxide");
  return out;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};

/** Calendar-month add that clamps to month end (31 Aug + 6M = 28/29 Feb), in UTC so SAST never shifts the day. */
export const addMonths = (iso: string, months: number): string => {
  const d = parse(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIso(target);
};

export const daysBetween = (fromIso: string, toIsoDate: string): number => Math.round((parse(toIsoDate).getTime() - parse(fromIso).getTime()) / 86_400_000);

export type PaoState = "ok" | "soon" | "expired";
export const SOON_DAYS = 30;

export interface ShelfItemLike {
  opened_on: string;
  pao_months: number;
  actives: ActiveTag[];
  looks_oxidised?: boolean;
}

export interface PaoSummary {
  expiresOn: string;
  daysLeft: number;
  state: PaoState;
  /** Unstable actives whose typical window is shorter than the label PAO and has already passed. */
  pastTypicalWindow: { tag: ActiveTag; label: string; since: string }[];
  warnings: { tag: ActiveTag; label: string; warning: string; sign: string }[];
  oxidised: boolean;
}

export const summarisePao = (item: ShelfItemLike, today: string): PaoSummary => {
  const expiresOn = addMonths(item.opened_on, item.pao_months);
  const daysLeft = daysBetween(today, expiresOn);
  const state: PaoState = daysLeft < 0 ? "expired" : daysLeft <= SOON_DAYS ? "soon" : "ok";
  const pastTypicalWindow = item.actives
    .map((tag) => ({ tag, g: UNSTABLE_ACTIVES[tag] }))
    .filter(({ g }) => g && g.typicalMonths < item.pao_months)
    .map(({ tag, g }) => ({ tag, label: g.label, since: addMonths(item.opened_on, g.typicalMonths) }))
    .filter((w) => today > w.since);
  const warnings = item.actives.filter((t) => UNSTABLE_ACTIVES[t]).map((tag) => ({ tag, label: UNSTABLE_ACTIVES[tag].label, warning: UNSTABLE_ACTIVES[tag].warning, sign: UNSTABLE_ACTIVES[tag].sign }));
  return { expiresOn, daysLeft, state, pastTypicalWindow, warnings, oxidised: Boolean(item.looks_oxidised) };
};

export interface RunoutInput {
  openedOn: string;
  today: string;
  sizeMl: number | null;
  mlPerUse: number;
  /** Check-ins in the last `windowDays` days for the linked routine step, when linked. */
  recentCheckins?: number | null;
  /** Check-ins since the bottle was opened (linked step). */
  checkinsSinceOpened?: number | null;
  /** Manual uses per week when no routine step is linked. */
  usesPerWeek?: number | null;
}

export interface RunoutEstimate {
  remainingMl: number;
  usesPerWeek: number;
  daysLeft: number;
  runOutOn: string;
  basis: "check-ins" | "manual";
}

export const CHECKIN_WINDOW_DAYS = 28;

export const estimateRunout = (i: RunoutInput): RunoutEstimate | null => {
  if (!i.sizeMl || i.sizeMl <= 0 || i.mlPerUse <= 0) return null;
  const sinceOpen = Math.max(1, daysBetween(i.openedOn, i.today));
  let usesPerDay: number;
  let used: number;
  let basis: RunoutEstimate["basis"];
  if (typeof i.recentCheckins === "number" && typeof i.checkinsSinceOpened === "number") {
    const window = Math.min(CHECKIN_WINDOW_DAYS, Math.max(7, sinceOpen));
    usesPerDay = i.recentCheckins / window;
    used = i.checkinsSinceOpened;
    basis = "check-ins";
  } else if (i.usesPerWeek && i.usesPerWeek > 0) {
    usesPerDay = i.usesPerWeek / 7;
    used = usesPerDay * sinceOpen;
    basis = "manual";
  } else {
    return null;
  }
  if (usesPerDay <= 0) return null;
  const remainingMl = Math.max(0, i.sizeMl - used * i.mlPerUse);
  const daysLeft = Math.round(remainingMl / (usesPerDay * i.mlPerUse));
  const runOut = parse(i.today);
  runOut.setUTCDate(runOut.getUTCDate() + daysLeft);
  return { remainingMl: Math.round(remainingMl * 10) / 10, usesPerWeek: Math.round(usesPerDay * 7 * 10) / 10, daysLeft, runOutOn: toIso(runOut), basis };
};

/** True when the label PAO runs out before the bottle is likely to be finished: worth saying out loud. */
export const expiresBeforeRunout = (expiresOn: string, estimate: RunoutEstimate | null): boolean => Boolean(estimate && expiresOn < estimate.runOutOn);
