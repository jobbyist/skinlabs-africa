import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import IngredientCard from "@/components/ingredients/IngredientCard";
import IngredientFilters from "@/components/ingredients/IngredientFilters";
import IngredientDisclaimer from "@/components/ingredients/IngredientDisclaimer";
import { useIngredients, INGREDIENTS_PER_PAGE, type IngredientFilters as Filters } from "@/hooks/use-ingredients";
import { SITE_URL } from "@/lib/seo-config";

const Ingredients = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const filters: Filters = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      concernSlug: searchParams.get("concern") || undefined,
      evidence: (searchParams.get("evidence") as Filters["evidence"]) || undefined,
    }),
    [searchParams],
  );

  const { data, isLoading } = useIngredients(filters, page);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / INGREDIENTS_PER_PAGE));

  const updateFilters = (next: Filters) => {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.category) params.set("category", next.category);
    if (next.concernSlug) params.set("concern", next.concernSlug);
    if (next.evidence) params.set("evidence", next.evidence);
    setSearchParams(params);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canonical = page > 1 ? `${SITE_URL}/ingredients?page=${page}` : `${SITE_URL}/ingredients`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Skincare Ingredients",
    description: "Discover skincare ingredients by function, concern, category and evidence strength.",
    url: canonical,
    ...(data?.items.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: data.items.map((ing, i) => ({
              "@type": "ListItem",
              position: (page - 1) * INGREDIENTS_PER_PAGE + i + 1,
              url: `${SITE_URL}/ingredients/${ing.slug}`,
              name: ing.common_name || ing.inci_name,
            })),
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Skincare Ingredients by Function & Concern"
        description="Explore skincare ingredients by function, skin concern, category and evidence strength — plain-language profiles backed by real sources, part of the SkinLabs® intelligence layer."
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-20 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FlaskConical className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Skincare Ingredients</h1>
            <p className="mt-3 text-muted-foreground">
              Explore ingredients by function, concern, category and evidence. Want to check if two ingredients
              play well together?{" "}
              <Link to="/ingredients/checker" className="font-medium text-primary underline underline-offset-2">
                Try the Combination Checker
              </Link>
              .
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            <IngredientFilters filters={filters} onChange={updateFilters} />
          </div>

          <div className="mx-auto mt-8 max-w-5xl">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Showing {(page - 1) * INGREDIENTS_PER_PAGE + 1}–
                  {Math.min(page * INGREDIENTS_PER_PAGE, total)} of {total} ingredients
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.items.map((ing) => (
                    <IngredientCard key={ing.id} ingredient={ing} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No ingredients match those filters. Try broadening your search.
              </div>
            )}
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <IngredientDisclaimer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Ingredients;
