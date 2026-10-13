import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeftRight, AlertTriangle, CheckCircle2, Clock, Sparkles, HelpCircle, Shuffle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import IngredientCombobox from "@/components/ingredients/IngredientCombobox";
import IngredientDisclaimer from "@/components/ingredients/IngredientDisclaimer";
import ProductScanner from "@/components/ingredients/ProductScanner";
import SourceCitationList from "@/components/ingredients/SourceCitationList";
import { Button } from "@/components/ui/button";
import { useIngredientCompatibility, useIngredientOptionBySlug } from "@/hooks/use-ingredient-compatibility";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { useAuth } from "@/hooks/use-auth";
import type { IngredientOption } from "@/hooks/use-ingredient-compatibility";
import { SITE_URL } from "@/lib/seo-config";

const RESULT_META = {
  compatible: { label: "Compatible", icon: CheckCircle2, className: "border-primary/30 bg-primary/5 text-primary" },
  enhances: { label: "Works well together", icon: Sparkles, className: "border-primary/30 bg-primary/5 text-primary" },
  buffers: { label: "Can help buffer irritation", icon: CheckCircle2, className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
  requires_spacing: { label: "Space out use", icon: Clock, className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  avoid_combining: { label: "Avoid combining", icon: AlertTriangle, className: "border-destructive/30 bg-destructive/5 text-destructive" },
} as const;

const NOTE_SOURCE_META = {
  curated: { label: "Cited SkinLabs note", className: "bg-primary/10 text-primary" },
  class_guidance: { label: "Class guidance — based on the types of ingredient, not a tested pairing", className: "bg-muted text-muted-foreground" },
  general: { label: "Nothing on record", className: "bg-muted text-muted-foreground" },
} as const;

const IngredientChecker = () => {
  const [searchParams] = useSearchParams();
  const [a, setA] = useState<IngredientOption | null>(null);
  const [b, setB] = useState<IngredientOption | null>(null);
  // Links from ingredient pages: /ingredients/checker?a=retinol&b=glycolic-acid
  const { data: presetA } = useIngredientOptionBySlug(searchParams.get("a"));
  const { data: presetB } = useIngredientOptionBySlug(searchParams.get("b"));
  useEffect(() => {
    if (presetA) setA((cur) => cur ?? presetA);
  }, [presetA]);
  useEffect(() => {
    if (presetB) setB((cur) => cur ?? presetB);
  }, [presetB]);
  const { data: result, isLoading, isFetched } = useIngredientCompatibility(a?.id, b?.id);
  const { user } = useAuth();

  const swap = () => {
    setA(b);
    setB(a);
  };

  const sameIngredient = !!a && !!b && a.id === b.id;

  // Clear selections when user logs out
  useEffect(() => {
    if (!user) {
      setA(null);
      setB(null);
    }
  }, [user]);

  const showAuthGate = !user && (a || b);

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
              Pick any two ingredients for a compatibility note. Where SkinLabs has a cited note you get it;
              otherwise you get guidance for those types of ingredient, clearly labelled, or an honest
              "nothing on record" — never a guess.
            </p>
          </div>

          {!user && (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-sm text-foreground">
                <strong>Sign in required:</strong> The Ingredient Combination checker is available for free to all members for a limited time.{" "}
                <button type="button" onClick={() => openSignupDialog()} className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                  Sign in or create a free account
                </button>{" "}
                to use this feature.
              </p>
            </div>
          )}

          {showAuthGate && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center backdrop-blur-sm">
              <p className="text-lg font-semibold text-foreground mb-2">Authentication required</p>
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to check ingredient compatibility. Anonymous users can browse ingredient profiles but cannot use the Combination checker.
              </p>
              <Button className="mx-auto" onClick={() => openSignupDialog()}>
                Sign In / Sign Up
              </Button>
            </div>
          )}

          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ingredient A</label>
              <IngredientCombobox 
                value={a} 
                onChange={setA} 
                placeholder="e.g. Retinol"
                disabled={!user}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={swap} 
              aria-label="Swap ingredients" 
              className="mb-0.5"
              disabled={!user}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ingredient B</label>
              <IngredientCombobox 
                value={b} 
                onChange={setB} 
                placeholder="e.g. Glycolic Acid"
                disabled={!user}
              />
            </div>
          </div>

          {!showAuthGate && (
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
                <p className="font-medium text-foreground">We couldn't load a note for this pair</p>
                <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
              </div>
            )}

            {!sameIngredient && a && b && result && (() => {
              const source = (result.note_source as keyof typeof NOTE_SOURCE_META) in NOTE_SOURCE_META ? (result.note_source as keyof typeof NOTE_SOURCE_META) : "general";
              const meta = result.interaction_type ? RESULT_META[result.interaction_type] : null;
              const Icon = meta?.icon ?? HelpCircle;
              return (
                <div className={`rounded-2xl border p-6 ${meta ? meta.className : "border-border bg-muted/30 text-foreground"}`}>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{a.label} + {b.label}: {meta ? meta.label : "No interaction on record"}</span>
                  </div>
                  <p className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${NOTE_SOURCE_META[source].className}`}>{result.source_label || NOTE_SOURCE_META[source].label}</p>
                  {result.explanation && <p className="mt-3 text-sm opacity-90">{result.explanation}</p>}
                  {result.usage_guidance && <p className="mt-2 text-sm font-medium opacity-90">Guidance: {result.usage_guidance}</p>}
                  {result.source_url && <SourceCitationList sources={[{ label: result.source_url, url: result.source_url }]} />}
                </div>
              );
            })()}

            {!a && !b && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Select two ingredients above to check their compatibility.
              </div>
            )}
          </div>
          )}

          <div className="mt-10">
            <div className="mb-10"><ProductScanner /></div>
            <IngredientDisclaimer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IngredientChecker;
