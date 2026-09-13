import { useState } from "react";
import { ArrowLeftRight, AlertTriangle, CheckCircle2, Clock, Sparkles, HelpCircle, Shuffle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import IngredientCombobox from "@/components/ingredients/IngredientCombobox";
import IngredientDisclaimer from "@/components/ingredients/IngredientDisclaimer";
import SourceCitationList from "@/components/ingredients/SourceCitationList";
import { Button } from "@/components/ui/button";
import { useIngredientCompatibility } from "@/hooks/use-ingredient-compatibility";
import type { IngredientOption } from "@/hooks/use-ingredient-compatibility";
import { SITE_URL } from "@/lib/seo-config";

const RESULT_META = {
  compatible: { label: "Compatible", icon: CheckCircle2, className: "border-primary/30 bg-primary/5 text-primary" },
  enhances: { label: "Works well together", icon: Sparkles, className: "border-primary/30 bg-primary/5 text-primary" },
  buffers: { label: "Can help buffer irritation", icon: CheckCircle2, className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
  requires_spacing: { label: "Space out use", icon: Clock, className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  avoid_combining: { label: "Avoid combining", icon: AlertTriangle, className: "border-destructive/30 bg-destructive/5 text-destructive" },
} as const;

const IngredientChecker = () => {
  const [a, setA] = useState<IngredientOption | null>(null);
  const [b, setB] = useState<IngredientOption | null>(null);
  const { data: result, isLoading, isFetched } = useIngredientCompatibility(a?.id, b?.id);

  const swap = () => {
    setA(b);
    setB(a);
  };

  const sameIngredient = !!a && !!b && a.id === b.id;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Ingredient Combination Checker"
        description="Check whether two skincare ingredients are safe to combine — a free, DB-driven compatibility checker backed by real, cited sources. Part of the SkinLabs® ingredients intelligence layer."
        canonical={`${SITE_URL}/ingredients/checker`}
      />
      <Header />
      <main className="pt-20 pb-24">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Combination Checker</h1>
            <p className="mt-3 text-muted-foreground">
              Pick two ingredients to see whether SkinLabs has a verified compatibility note for that pair —
              database-driven, never a guess.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ingredient A</label>
              <IngredientCombobox value={a} onChange={setA} placeholder="e.g. Retinol" />
            </div>
            <Button variant="ghost" size="icon" onClick={swap} aria-label="Swap ingredients" className="mb-0.5">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ingredient B</label>
              <IngredientCombobox value={b} onChange={setB} placeholder="e.g. Glycolic Acid" />
            </div>
          </div>

          <div className="mt-8">
            {sameIngredient && (
              <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-muted-foreground">
                <Shuffle className="mx-auto mb-2 h-6 w-6" />
                Choose two different ingredients to compare.
              </div>
            )}

            {!sameIngredient && a && b && isLoading && (
              <div className="rounded-2xl border border-border p-6 text-center text-muted-foreground">Checking…</div>
            )}

            {!sameIngredient && a && b && isFetched && !result && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <HelpCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-medium text-foreground">No verified SkinLabs relationship yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We haven't published a compatibility note for {a.label} + {b.label}. That doesn't mean they
                  conflict — it means we haven't reviewed evidence for this specific pair yet.
                </p>
              </div>
            )}

            {!sameIngredient && a && b && result && (
              <div className={`rounded-2xl border p-6 ${RESULT_META[result.interaction_type].className}`}>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {(() => {
                    const Icon = RESULT_META[result.interaction_type].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {a.label} + {b.label}: {RESULT_META[result.interaction_type].label}
                </div>
                {result.explanation && <p className="mt-3 text-sm opacity-90">{result.explanation}</p>}
                {result.usage_guidance && (
                  <p className="mt-2 text-sm font-medium opacity-90">Guidance: {result.usage_guidance}</p>
                )}
                {result.source_url && <SourceCitationList sources={[{ label: result.source_url, url: result.source_url }]} />}
              </div>
            )}

            {!a && !b && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Select two ingredients above to check their compatibility.
              </div>
            )}
          </div>

          <div className="mt-10">
            <IngredientDisclaimer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IngredientChecker;
