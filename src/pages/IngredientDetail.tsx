import { useParams, Link, Navigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EvidenceBadge from "@/components/ingredients/EvidenceBadge";
import IngredientDisclaimer from "@/components/ingredients/IngredientDisclaimer";
import SourceCitationList from "@/components/ingredients/SourceCitationList";
import { useIngredientDetail, type IngredientInteractionLink } from "@/hooks/use-ingredient-detail";
import { ingredientCategoryLabel } from "@/lib/ingredientCategories";
import { SITE_URL } from "@/lib/seo-config";

const INTERACTION_META: Record<
  IngredientInteractionLink["interaction_type"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  compatible: { label: "Compatible", icon: CheckCircle2, className: "border-primary/30 bg-primary/5 text-primary" },
  enhances: { label: "Works well together", icon: Sparkles, className: "border-primary/30 bg-primary/5 text-primary" },
  buffers: { label: "Can help buffer irritation", icon: CheckCircle2, className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
  requires_spacing: { label: "Space out use", icon: Clock, className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  avoid_combining: { label: "Avoid combining", icon: AlertTriangle, className: "border-destructive/30 bg-destructive/5 text-destructive" },
};

const IngredientDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useIngredientDetail(slug);

  if (!slug) return <Navigate to="/ingredients" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-20 pb-24">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto mt-6 h-40 max-w-3xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-20 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Couldn't load this ingredient</h1>
          <p className="mt-2 text-muted-foreground">Something went wrong fetching this page. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-20 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Ingredient not found</h1>
          <p className="mt-2 text-muted-foreground">
            We don't have a profile for that ingredient yet.{" "}
            <Link to="/ingredients" className="text-primary underline underline-offset-2">
              Browse all ingredients
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const { ingredient, concerns, interactions, products } = data;
  const name = ingredient.common_name || ingredient.inci_name;
  const canonical = `${SITE_URL}/ingredients/${ingredient.slug}`;
  const worksWith = interactions.filter((i) => i.interaction_type === "enhances" || i.interaction_type === "compatible");
  const useWithCaution = interactions.filter(
    (i) => i.interaction_type === "avoid_combining" || i.interaction_type === "requires_spacing" || i.interaction_type === "buffers",
  );
  const allSources = interactions
    .filter((i) => i.source_url)
    .map((i) => ({ label: i.source_url as string, url: i.source_url as string }));
  if (ingredient.source_url) allSources.unshift({ label: ingredient.source_url, url: ingredient.source_url });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${name} — Benefits, Uses & Skin Compatibility`,
    url: canonical,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ingredients", item: `${SITE_URL}/ingredients` },
        { "@type": "ListItem", position: 2, name, item: canonical },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${name} (${ingredientCategoryLabel(ingredient.category)}) — Benefits & Uses`}
        description={`Learn about ${name}: what it does, who it benefits, and the evidence supporting its use in skincare — part of the SkinLabs® ingredients intelligence layer.`}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-20 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/ingredients" className="hover:text-foreground">
              Ingredients
            </Link>{" "}
            / <span className="text-foreground">{name}</span>
          </nav>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ingredientCategoryLabel(ingredient.category)}</Badge>
              <EvidenceBadge level={ingredient.evidence_level} />
              {ingredient.pregnancy_safe === false && (
                <Badge variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
                  Not recommended during pregnancy
                </Badge>
              )}
              {ingredient.irritancy_risk === "high" && (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                  High irritation potential
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{name}</h1>
            {ingredient.common_name && ingredient.common_name !== ingredient.inci_name && (
              <p className="mt-1 italic text-muted-foreground">INCI: {ingredient.inci_name}</p>
            )}
          </header>

          <div className="space-y-8">
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">What is it?</h2>
              <p className="mt-2 text-muted-foreground">
                {ingredient.description || ingredient.function_summary || "A detailed profile for this ingredient is still being written."}
              </p>
            </section>

            {ingredient.function_summary && ingredient.description && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">What does it do?</h2>
                <p className="mt-2 text-muted-foreground">{ingredient.function_summary}</p>
              </section>
            )}

            {concerns.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Who may benefit?</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {concerns.map((c) => (
                    <Badge
                      key={c.concern_slug}
                      variant="outline"
                      className={
                        c.relationship === "may_worsen"
                          ? "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          : ""
                      }
                    >
                      {c.relationship === "may_worsen" ? "May worsen: " : c.relationship === "preventive" ? "May help prevent: " : "May help with: "}
                      {c.concern_name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {ingredient.typical_concentration_range && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">How to use</h2>
                <p className="mt-2 text-muted-foreground">
                  Typically formulated at {ingredient.typical_concentration_range}.
                  {ingredient.formulation_notes ? ` ${ingredient.formulation_notes}` : ""}
                </p>
              </section>
            )}

            {worksWith.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Ingredients it works with</h2>
                <div className="mt-3 space-y-3">
                  {worksWith.map((i) => {
                    const meta = INTERACTION_META[i.interaction_type];
                    const Icon = meta.icon;
                    return (
                      <div key={i.id} className={`rounded-xl border p-4 ${meta.className}`}>
                        <div className="flex items-center gap-2 font-semibold">
                          <Icon className="h-4 w-4" />
                          <Link to={`/ingredients/${i.other_ingredient_slug}`} className="underline underline-offset-2">
                            {i.other_ingredient_name}
                          </Link>
                          <span className="text-xs font-normal opacity-80">— {meta.label}</span>
                        </div>
                        {i.explanation && <p className="mt-1.5 text-sm opacity-90">{i.explanation}</p>}
                        {i.usage_guidance && <p className="mt-1 text-xs opacity-75">{i.usage_guidance}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {useWithCaution.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Use with caution</h2>
                <div className="mt-3 space-y-3">
                  {useWithCaution.map((i) => {
                    const meta = INTERACTION_META[i.interaction_type];
                    const Icon = meta.icon;
                    return (
                      <div key={i.id} className={`rounded-xl border p-4 ${meta.className}`}>
                        <div className="flex items-center gap-2 font-semibold">
                          <Icon className="h-4 w-4" />
                          <Link to={`/ingredients/${i.other_ingredient_slug}`} className="underline underline-offset-2">
                            {i.other_ingredient_name}
                          </Link>
                          <span className="text-xs font-normal opacity-80">— {meta.label}</span>
                        </div>
                        {i.explanation && <p className="mt-1.5 text-sm opacity-90">{i.explanation}</p>}
                        {i.usage_guidance && <p className="mt-1 text-xs opacity-75">{i.usage_guidance}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Real products containing this</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {products.map((p) => (
                    <Link
                      key={p.product_id}
                      to={`/reviews/${p.product_slug}`}
                      className="group flex items-center justify-between rounded-xl border border-border p-3 text-sm hover:border-primary/40"
                    >
                      <span>
                        <span className="font-medium text-foreground">{p.product_name}</span>
                        {p.brand_name && <span className="text-muted-foreground"> — {p.brand_name}</span>}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground">Sources</h2>
              {allSources.length > 0 ? (
                <SourceCitationList sources={allSources} />
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  This profile hasn't been linked to an external source yet — it's marked{" "}
                  {ingredient.verification_status.replace("_", " ")} pending editorial review.
                </p>
              )}
            </section>

            <IngredientDisclaimer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IngredientDetail;
