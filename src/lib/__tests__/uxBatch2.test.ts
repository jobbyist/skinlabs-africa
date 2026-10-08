import { describe, expect, test, afterEach } from "bun:test";
import { withEntry, resolveScrollIntent, shouldShowBackToTop, MAX_ENTRIES } from "@/lib/scrollMemory";
import { chunkForPath } from "@/lib/routePrefetch";
import {
  SEARCH_FILTERS, groupAllowed, isFragranceFreeText, reviewHighveldBarrier, reviewMatchesFilter, reviewUnder250, textMatchesFilter, type FilterableReview,
} from "@/lib/searchFilters";
import { parseConcernsParam, saBotanicalMatch, toggleConcern, unionByName } from "@/lib/ingredientMatrix";
import { routineClimateBadge } from "@/lib/climateRoutine";
import { addMonths, detectActives, estimateRunout, expiresBeforeRunout, summarisePao } from "@/lib/shelf/pao";
import { evictionForCap } from "@/lib/pwa/offlineReading";
import { groupConflicts, higherIrritancy, matchAllergies, mstConsiderations, parseInci, type ScannedIngredient } from "@/lib/inci/scanner";
import { HAPTIC_PULSE, haptic, setHapticsPreference } from "@/lib/haptics";

describe("scroll memory", () => {
  test("caps entries, dropping the oldest", () => {
    let m: Record<string, number> = {};
    for (let i = 0; i < MAX_ENTRIES + 5; i++) m = withEntry(m, `k${i}`, i * 10);
    expect(Object.keys(m).length).toBe(MAX_ENTRIES);
    expect(m.k0).toBeUndefined();
    expect(m[`k${MAX_ENTRIES + 4}`]).toBe((MAX_ENTRIES + 4) * 10);
  });
  test("Back restores, a new page goes to the top, a hash wins over top", () => {
    expect(resolveScrollIntent({ navType: "POP", hash: "", remembered: 1800 })).toEqual({ type: "restore", y: 1800 });
    expect(resolveScrollIntent({ navType: "PUSH", hash: "", remembered: 1800 })).toEqual({ type: "top" });
    expect(resolveScrollIntent({ navType: "PUSH", hash: "#skynn-launchpad", remembered: null })).toEqual({ type: "hash", id: "skynn-launchpad" });
    expect(resolveScrollIntent({ navType: "POP", hash: "", remembered: 0 })).toEqual({ type: "top" });
  });
});

describe("back to top", () => {
  test("appears past 1.5 viewport heights", () => {
    expect(shouldShowBackToTop(1000, 800)).toBe(false);
    expect(shouldShowBackToTop(1201, 800)).toBe(true);
  });
});

describe("route prefetch map", () => {
  test("covers the extra destinations", () => {
    expect(chunkForPath("/ingredients/checker")).toBe("checker");
    expect(chunkForPath("/ingredients/niacinamide")).toBe("ingredient");
    expect(chunkForPath("/ingredients")).toBe("ingredients");
    expect(chunkForPath("/routines")).toBe("routines");
    expect(chunkForPath("/offline-reading/briefing/x")).toBe("offlineReading");
  });
});

const review = (o: Partial<FilterableReview> = {}): FilterableReview => ({
  local_price_zar: 199, score_climate: 8, skin_type_match: ["dry"], key_ingredients: ["Ceramide NP"], verdict: "A rich barrier cream.", ...o,
});

describe("search filter chips", () => {
  test("the six chips exist in order", () => {
    expect(SEARCH_FILTERS.map((f) => f.label)).toEqual(["All", "Ingredients", "Reviews under R250", "Highveld Barrier", "Fragrance-Free", "Podcast"]);
  });
  test("under R250 is strictly under", () => {
    expect(reviewUnder250(review({ local_price_zar: 249 }))).toBe(true);
    expect(reviewUnder250(review({ local_price_zar: 250 }))).toBe(false);
    expect(reviewUnder250(review({ local_price_zar: 0 }))).toBe(false);
  });
  test("fragrance-free needs an explicit claim and respects a negation", () => {
    expect(isFragranceFreeText("A fragrance-free moisturiser")).toBe(true);
    expect(isFragranceFreeText("Unscented and gentle")).toBe(true);
    expect(isFragranceFreeText("Lovely cream")).toBe(false);
    expect(isFragranceFreeText("Not fragrance-free, contains added fragrance")).toBe(false);
    expect(reviewMatchesFilter(review({ verdict: "Fragrance free and plain." }), "fragrance-free")).toBe(true);
    expect(reviewMatchesFilter(review(), "fragrance-free")).toBe(false);
  });
  test("highveld barrier = barrier formula that suits dry air", () => {
    expect(reviewHighveldBarrier(review())).toBe(true);
    expect(reviewHighveldBarrier(review({ key_ingredients: ["Niacinamide"], verdict: "Brightening." }))).toBe(false);
    expect(reviewHighveldBarrier(review({ score_climate: 4, skin_type_match: ["oily"] }))).toBe(false);
    expect(textMatchesFilter("Winter barrier repair for dry Highveld skin", "highveld-barrier")).toBe(true);
    expect(textMatchesFilter("Sunscreen tips", "highveld-barrier")).toBe(false);
  });
  test("groups per chip", () => {
    expect(groupAllowed("podcast", "podcast")).toBe(true);
    expect(groupAllowed("podcast", "reviews")).toBe(false);
    expect(groupAllowed("all", "anything")).toBe(true);
    expect(groupAllowed("ingredients", "ingredients")).toBe(true);
  });
});

describe("ingredient matrix", () => {
  test("SA botanicals matched by name, not by guess", () => {
    expect(saBotanicalMatch({ inci_name: "Sclerocarya Birrea Seed Oil", common_name: "Marula Oil", slug: "marula-oil" })).toBe("Marula");
    expect(saBotanicalMatch({ inci_name: "Aspalathus Linearis Leaf Extract", common_name: null, slug: "rooibos" })).toBe("Rooibos");
    expect(saBotanicalMatch({ inci_name: "Myrothamnus Flabellifolia", common_name: "Resurrection Bush", slug: "resurrection-bush" })).toBe("Resurrection bush");
    expect(saBotanicalMatch({ inci_name: "Niacinamide", common_name: null, slug: "niacinamide" })).toBeNull();
    expect(saBotanicalMatch({ inci_name: "Citrullus Lanatus Seed Oil", common_name: "Watermelon seed oil", slug: "watermelon-seed-oil" })).toBeNull();
  });
  test("concern params are sanitised, toggled and unioned", () => {
    expect(parseConcernsParam("acne, aging,acne,<script>")).toEqual(["acne", "aging"]);
    expect(toggleConcern(["acne"], "aging")).toEqual(["acne", "aging"]);
    expect(toggleConcern(["acne", "aging"], "acne")).toEqual(["aging"]);
    const a = { id: "1", slug: "b", inci_name: "B", common_name: null };
    const b = { id: "2", slug: "a", inci_name: "A", common_name: null };
    expect(unionByName([[a], [a, b]]).map((i) => i.id)).toEqual(["2", "1"]);
  });
});

describe("routine climate badges", () => {
  const summer = new Date(2026, 0, 15);
  const spring = new Date(2026, 9, 8);
  test("Highveld alert only when the air is actually dry", () => {
    expect(routineClimateBadge("johannesburg", { humidity: 28 })?.text).toBe("Add an occlusive layer over humectants.");
    expect(routineClimateBadge("pretoria", { humidity: 28 })?.basis).toBe("live");
    expect(routineClimateBadge("johannesburg", { humidity: 70 })).toBeNull();
    expect(routineClimateBadge("johannesburg", null)?.basis).toBe("typical");
  });
  test("Durban humidity swap", () => {
    expect(routineClimateBadge("durban", { humidity: 82 })?.text).toBe("Swap heavy cream for a gel hydrator.");
    expect(routineClimateBadge("durban", { humidity: 40 })).toBeNull();
  });
  test("Cape Town: pollen wording in spring only", () => {
    expect(routineClimateBadge("cape-town", null, spring)?.title).toBe("Spring Pollen / Wind Barrier Alert");
    expect(routineClimateBadge("cape-town", null, summer)?.title).toBe("Cape Wind Barrier Alert");
    expect(routineClimateBadge("cape-town", null, spring)?.text).toBe("Prioritize ceramide replenishment.");
  });
  test("other cities and no city say nothing; wording stays cosmetic", () => {
    expect(routineClimateBadge("mbombela", null)).toBeNull();
    expect(routineClimateBadge(null, null)).toBeNull();
    const all = ["johannesburg", "durban", "cape-town"].map((c) => JSON.stringify(routineClimateBadge(c, null, spring))).join(" ");
    expect(/diagnos|treat|cure|disease/i.test(all)).toBe(false);
  });
});

describe("shelf / PAO", () => {
  test("addMonths clamps to month end", () => {
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
    expect(addMonths("2026-01-15", 12)).toBe("2027-01-15");
    expect(addMonths("2027-08-31", 6)).toBe("2028-02-29");
  });
  test("states and the vitamin C window", () => {
    const item = { opened_on: "2026-01-10", pao_months: 12, actives: ["vitamin_c" as const] };
    const s = summarisePao(item, "2026-06-01");
    expect(s.state).toBe("ok");
    expect(s.pastTypicalWindow[0]?.label).toContain("Vitamin C");
    expect(summarisePao(item, "2027-01-01").state).toBe("soon");
    expect(summarisePao(item, "2027-02-01").state).toBe("expired");
    expect(summarisePao({ ...item, actives: [] }, "2026-06-01").pastTypicalWindow).toHaveLength(0);
  });
  test("active detection ignores stable derivatives", () => {
    expect(detectActives("15% L-Ascorbic Acid Serum")).toEqual(["vitamin_c"]);
    expect(detectActives("Vitamin C booster")).toEqual(["vitamin_c"]);
    expect(detectActives("Sodium Ascorbyl Phosphate serum")).toEqual([]);
    expect(detectActives("Retinol 0.5% night")).toEqual(["retinoid"]);
    expect(detectActives("Benzoyl peroxide 5% gel")).toEqual(["benzoyl_peroxide"]);
  });
  test("run-out from check-ins and from manual use", () => {
    const base = { openedOn: "2026-09-01", today: "2026-09-29", sizeMl: 30, mlPerUse: 0.5 };
    const viaCheckins = estimateRunout({ ...base, recentCheckins: 28, checkinsSinceOpened: 28 });
    expect(viaCheckins?.basis).toBe("check-ins");
    expect(viaCheckins?.usesPerWeek).toBe(7);
    expect(viaCheckins?.remainingMl).toBe(16);
    expect(viaCheckins?.daysLeft).toBe(32);
    expect(estimateRunout({ ...base, usesPerWeek: 7 })?.basis).toBe("manual");
    expect(estimateRunout({ ...base })).toBeNull();
    expect(estimateRunout({ ...base, sizeMl: null, usesPerWeek: 7 })).toBeNull();
    expect(expiresBeforeRunout("2026-10-15", viaCheckins)).toBe(true);
    expect(expiresBeforeRunout("2027-10-15", viaCheckins)).toBe(false);
  });
});

describe("offline reading queue", () => {
  test("evicts oldest when at the cap", () => {
    const items = Array.from({ length: 3 }, (_, i) => ({ id: `x${i}`, savedAt: 100 - i }));
    expect(evictionForCap(items, 3)).toEqual(["x2"]);
    expect(evictionForCap(items, 5)).toEqual([]);
  });
});

describe("INCI scanner", () => {
  test("parses a label list", () => {
    const p = parseInci("Ingredients: Aqua (Water), Glycerin, Niacinamide, Parfum*, Glycerin.\nMay contain: CI 77891");
    expect(p.items).toEqual(["Aqua (Water)", "Glycerin", "Niacinamide", "Parfum"]);
  });
  test("keeps commas inside parentheses together and handles line breaks", () => {
    expect(parseInci("Tocopherol (Vitamin E, natural)\nSqualane • Panthenol").items).toEqual(["Tocopherol (Vitamin E, natural)", "Squalane", "Panthenol"]);
  });
  test("allergy matching uses aliases and a 3-char minimum", () => {
    const hits = matchAllergies(["Aqua", "Parfum", "Linalool", "Prunus Amygdalus Dulcis Oil"], ["fragrance", "nut oils", "ab"]);
    expect(hits.map((h) => h.ingredient)).toEqual(["Parfum", "Linalool", "Prunus Amygdalus Dulcis Oil"]);
    expect(matchAllergies(["Aqua"], ["fragrance"])).toEqual([]);
  });
  test("conflicts: inside the product vs with the routine", () => {
    const scanned = new Map([["r", "Retinol"], ["g", "Glycolic Acid"]]);
    const routine = new Map([["v", { name: "Vitamin C", source: { steps: [{ name: "Serum", slot: "am" as const }] } }]]);
    const out = groupConflicts(
      [
        { ingredientAId: "r", ingredientBId: "g", type: "avoid_combining", explanation: "x", guidance: null },
        { ingredientAId: "v", ingredientBId: "r", type: "requires_spacing", explanation: null, guidance: "y" },
        { ingredientAId: "v", ingredientBId: "zz", type: "avoid_combining", explanation: null, guidance: null },
      ],
      scanned,
      routine,
    );
    expect(out.map((c) => c.scope)).toEqual(["within_product", "with_routine"]);
    expect(out[1].routine[0].name).toBe("Serum");
  });
  test("MST notes only from a self-reported tone of 4+, never inferred", () => {
    const items: ScannedIngredient[] = [
      { token: "Retinol", match: { id: "1", slug: "retinol", name: "Retinol", category: "retinoid", irritancy: "moderate" } },
      { token: "Parfum", match: null },
      { token: "Glycerin", match: { id: "2", slug: "glycerin", name: "Glycerin", category: "humectant", irritancy: "low" } },
    ];
    expect(mstConsiderations(null, items)).toBeNull();
    expect(mstConsiderations(2, items)).toBeNull();
    const r = mstConsiderations(8, items);
    expect(r?.considerations.map((c) => c.ingredient)).toEqual(["Retinol", "Parfum"]);
    expect(higherIrritancy(items)).toHaveLength(0);
  });
});

describe("haptics", () => {
  const nav = globalThis.navigator as unknown as { vibrate?: unknown };
  const original = nav.vibrate;
  afterEach(() => {
    Object.defineProperty(globalThis.navigator, "vibrate", { value: original, configurable: true });
  });
  test("the pulse is a single 15ms vibration", () => {
    expect(HAPTIC_PULSE).toEqual([15]);
  });
  test("no-ops without the Vibration API", () => {
    Object.defineProperty(globalThis.navigator, "vibrate", { value: undefined, configurable: true });
    expect(haptic()).toBe(false);
  });
  test("vibrates once when supported and not switched off", () => {
    const calls: unknown[] = [];
    Object.defineProperty(globalThis.navigator, "vibrate", { value: (p: unknown) => (calls.push(p), true), configurable: true });
    Object.defineProperty(globalThis.navigator, "webdriver", { value: false, configurable: true });
    const g = globalThis as unknown as { window?: unknown };
    g.window = { localStorage: { getItem: () => null, setItem: () => undefined }, matchMedia: () => ({ matches: false }) };
    expect(haptic()).toBe(true);
    expect(calls).toEqual([[15]]);
    setHapticsPreference(false);
    delete g.window;
  });
});

describe("photo OCR helpers", () => {
  test("downscales large photos, never upscales", async () => {
    const { fitWithin, cleanOcrText } = await import("@/lib/inci/ocr");
    expect(fitWithin(4000, 3000)).toEqual({ width: 1800, height: 1350 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(cleanOcrText("Aqua, Hyaluro-\nnate,\nGlycerin  |  Niacinamide")).toBe("Aqua, Hyaluronate, Glycerin I Niacinamide");
  });
});
