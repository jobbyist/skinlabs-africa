import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Camera, CheckCircle2, HelpCircle, Loader2, ScanSearch, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserAllergies } from "@/hooks/use-allergy-flags";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { parseInci, matchAllergies, groupConflicts, higherIrritancy, mstConsiderations, isCaution, MAX_TOKENS, type ConflictFinding, type RawConflict, type RoutineSource, type ScannedIngredient } from "@/lib/inci/scanner";
import { resolveTokens } from "@/lib/inci/resolve";
import { photoReadingSupported, readTextFromPhoto } from "@/lib/inci/ocr";
import { haptic } from "@/lib/haptics";

/** The member's routine ingredients: steps linked to a reviewed product (product_slug) -> that product's current formulation. */
const useRoutineIngredients = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scanner-routine", user?.id],
    enabled: Boolean(user),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data: steps } = await supabase.from("routine_steps").select("step_name, time_of_day, product_slug").eq("user_id", user!.id).not("product_slug", "is", null);
      const linked = (steps ?? []).filter((s) => s.product_slug);
      const map = new Map<string, { name: string; source: RoutineSource }>();
      if (linked.length === 0) return { linkedSteps: 0, map };
      const { data } = await supabase
        .from("product_ingredients")
        .select("product_versions!inner(is_current, products!inner(slug)), ingredients(id, inci_name, common_name)")
        .eq("product_versions.is_current", true)
        .in("product_versions.products.slug", [...new Set(linked.map((s) => s.product_slug as string))]);
      for (const row of data ?? []) {
        const ing = row.ingredients as { id: string; inci_name: string; common_name: string | null } | null;
        const slug = (row.product_versions as { products: { slug: string } | null } | null)?.products?.slug;
        if (!ing || !slug) continue;
        const entry = map.get(ing.id) ?? { name: ing.common_name || ing.inci_name, source: { steps: [] } };
        for (const s of linked.filter((l) => l.product_slug === slug)) entry.source.steps.push({ name: s.step_name, slot: s.time_of_day as "am" | "pm" | "both" });
        map.set(ing.id, entry);
      }
      return { linkedSteps: linked.length, map };
    },
  });
};

/** The member's self-reported Monk Skin Tone from their latest delivered analysis (never inferred). */
const useMemberMst = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scanner-mst", user?.id],
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("skincare_recommendations").select("mst_tone").eq("user_id", user!.id).eq("status", "delivered").not("mst_tone", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data?.mst_tone ?? null;
    },
  });
};

interface Analysis {
  items: ScannedIngredient[];
  truncated: boolean;
  conflicts: ConflictFinding[];
  checkedRoutine: boolean;
}

const SLOT = { am: "AM", pm: "PM", both: "AM + PM" } as const;
const Section = ({ icon: Icon, title, children, tone }: { icon: typeof AlertTriangle; title: string; children: React.ReactNode; tone?: "warn" }) => (
  <section className={`rounded-2xl border p-4 ${tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {title}</h3>
    {children}
  </section>
);

const ProductScanner = () => {
  const { user } = useAuth();
  const { data: allergies } = useUserAllergies();
  const { data: routine } = useRoutineIngredients();
  const { data: mst } = useMemberMst();
  const [text, setText] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = useMutation({
    mutationFn: async (): Promise<Analysis> => {
      const parsed = parseInci(text);
      if (parsed.items.length < 2) throw new Error("Paste the full ingredient list (at least two ingredients, separated by commas).");
      setProgress({ done: 0, total: parsed.items.length });
      const items = await resolveTokens(parsed.items, (done) => setProgress({ done, total: parsed.items.length }));
      const scanned = new Map(items.filter((i) => i.match).map((i) => [i.match!.id, i.match!.name]));
      let conflicts: ConflictFinding[] = [];
      const routineMap = routine?.map ?? new Map();
      if (scanned.size > 0) {
        const ids = [...new Set([...scanned.keys(), ...routineMap.keys()])];
        const { data, error } = await supabase.rpc("get_routine_conflicts", { p_ingredient_ids: ids });
        if (error) throw new Error("Couldn't check ingredient conflicts just now. Try again in a moment.");
        const raw: RawConflict[] = (data ?? []).map((r) => ({ ingredientAId: r.ingredient_a_id, ingredientBId: r.ingredient_b_id, type: r.interaction_type, explanation: r.explanation, guidance: r.usage_guidance }));
        conflicts = groupConflicts(raw, scanned, routineMap);
      }
      return { items, truncated: parsed.truncated, conflicts, checkedRoutine: routineMap.size > 0 };
    },
    onSuccess: (r) => { setResult(r); haptic(); },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setProgress(null),
  });

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const read = await readTextFromPhoto(file);
      if (!read.trim()) return toast.error("We couldn't read any text in that photo. Try a closer, well-lit shot of the ingredient list, or paste it instead.");
      setText(read);
      toast.success("Read on your device. Check the list before scanning: photos misread letters.");
    } catch {
      toast.error("Your browser can't read photos on-device yet. Paste the ingredient list instead.");
    }
  };

  const allergyHits = result ? matchAllergies(result.items.map((i) => i.token), allergies ?? []) : [];
  const irritants = result ? higherIrritancy(result.items) : [];
  const mstReport = result ? mstConsiderations(mst, result.items) : null;
  const unmatched = result?.items.filter((i) => !i.match) ?? [];
  const cautions = result?.conflicts.filter((c) => isCaution(c.type)) ?? [];
  const positives = result?.conflicts.filter((c) => !isCaution(c.type)) ?? [];

  return (
    <section aria-labelledby="scanner-title" className="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <h2 id="scanner-title" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground"><ScanSearch className="h-5 w-5" aria-hidden="true" /> Analyze a full product</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Paste the complete ingredient (INCI) list from the pack. We match each ingredient to our catalogue and check it against your profile and routine.</p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={4000}
        aria-label="Product ingredient list"
        placeholder="Aqua, Glycerin, Niacinamide, Butylene Glycol, Parfum…"
        className="mt-4"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={() => scan.mutate()} disabled={scan.isPending || text.trim().length < 3} data-haptic className="gap-2">
          {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />} Analyze
        </Button>
        {photoReadingSupported() && (
          <>
            <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}><Camera className="h-4 w-4" /> Read from a photo</Button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Photo of the ingredient list" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </>
        )}
        {progress && <span role="status" className="text-xs text-muted-foreground">Matching {progress.done} of {progress.total}…</span>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {photoReadingSupported() ? "Photos are read on your device and are never uploaded." : "Reading a photo needs a browser with on-device text detection; paste the list instead. Nothing you paste is saved."}
      </p>

      {result && (
        <div className="mt-6 space-y-3" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            Matched {result.items.length - unmatched.length} of {result.items.length} ingredients to our catalogue.
            {result.truncated && ` Only the first ${MAX_TOKENS} were checked.`}
          </p>

          {!user ? (
            <Section icon={ShieldAlert} title="Personal checks">
              <p className="text-sm text-muted-foreground">Sign in to also check this list against your allergies, your routine and your skin tone.</p>
              <Button size="sm" className="mt-3" onClick={() => openSignupDialog("signup")}>Create a free account</Button>
            </Section>
          ) : (
            <>
              <Section icon={allergyHits.length ? ShieldAlert : CheckCircle2} title="Your allergies and sensitivities" tone={allergyHits.length ? "warn" : undefined}>
                {allergyHits.length > 0 ? (
                  <ul className="space-y-1 text-sm text-foreground">
                    {allergyHits.map((h) => <li key={`${h.ingredient}-${h.term}`}><strong>{h.ingredient}</strong> may relate to “{h.term}” in your profile.</li>)}
                  </ul>
                ) : (allergies?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No allergies saved in your profile, so there was nothing to match. <Link to="/dashboard?tab=profile" className="underline">Add them</Link> for this check.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No ingredient names matched what you listed ({allergies!.join(", ")}). Matching is by name, so check the label yourself too.</p>
                )}
              </Section>

              <Section icon={cautions.length ? AlertTriangle : CheckCircle2} title="Conflicts" tone={cautions.length ? "warn" : undefined}>
                {cautions.length === 0 && <p className="text-sm text-muted-foreground">No recorded conflicts{result.checkedRoutine ? " inside this product or with your routine" : " inside this product"}.</p>}
                <ul className="space-y-2">
                  {cautions.map((c, i) => <ConflictRow key={i} c={c} />)}
                </ul>
                {!result.checkedRoutine && <p className="mt-2 text-xs text-muted-foreground">None of your routine steps are linked to a reviewed product yet, so we could only check inside this product. A Smart Routine links your steps to products.</p>}
                {positives.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Pairs that work well: {positives.slice(0, 4).map((c) => `${c.scanned} + ${c.other}`).join("; ")}.</p>}
              </Section>

              <Section icon={HelpCircle} title="Monk Skin Tone considerations">
                {mst == null ? (
                  <p className="text-sm text-muted-foreground">Add your own Monk Skin Tone in a <Link to="/skynn-ai" className="underline">Basic AI Skin Analysis</Link> to see tone-aware notes. We never guess it.</p>
                ) : mstReport ? (
                  <>
                    {mstReport.considerations.length > 0 ? (
                      <ul className="space-y-1 text-sm text-foreground">{mstReport.considerations.map((c) => <li key={c.ingredient}><strong>{c.ingredient}</strong>: {c.reason}</li>)}</ul>
                    ) : <p className="text-sm text-muted-foreground">Nothing in this list stands out as a common trigger for lingering marks.</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{mstReport.general}</p>
                  </>
                ) : <p className="text-sm text-muted-foreground">Nothing specific to flag for your tone. Daily SPF still matters.</p>}
              </Section>
            </>
          )}

          {irritants.length > 0 && (
            <Section icon={AlertTriangle} title="Higher irritancy ingredients">
              <p className="text-sm text-foreground">{irritants.map((i) => i.match!.name).join(", ")}. Introduce slowly and patch test first.</p>
            </Section>
          )}

          <Section icon={HelpCircle} title={`Ingredients (${result.items.length})`}>
            <ul className="flex flex-wrap gap-1.5">
              {result.items.map((i) => (
                <li key={i.token}>
                  {i.match ? <Link to={`/ingredients/${i.match.slug}`} className="inline-block rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent">{i.token}</Link>
                    : <span className="inline-block rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground" title="Not in our catalogue yet">{i.token}</span>}
                </li>
              ))}
            </ul>
            {unmatched.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Dashed ingredients aren't in our catalogue yet, so they weren't checked for conflicts. That doesn't mean they're safe.</p>}
          </Section>
          <p className="text-xs text-muted-foreground">General cosmetic information, not medical advice or a diagnosis. If you react to a product, stop using it and speak to a pharmacist or dermatologist.</p>
        </div>
      )}
    </section>
  );
};

const ConflictRow = ({ c }: { c: ConflictFinding }) => (
  <li className="text-sm text-foreground">
    <strong>{c.scanned}</strong> + <strong>{c.other}</strong>{" "}
    <span className="text-muted-foreground">({c.type === "avoid_combining" ? "avoid combining" : "space out"}, {c.scope === "within_product" ? "inside this product" : `with your ${c.routine.map((r) => `${r.name} (${SLOT[r.slot]})`).join(", ")}`})</span>
    {(c.explanation || c.guidance) && <span className="block text-xs text-muted-foreground">{[c.explanation, c.guidance].filter(Boolean).join(" ")}</span>}
  </li>
);

export default ProductScanner;
