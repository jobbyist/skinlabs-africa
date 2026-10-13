import { useQuery } from "@tanstack/react-query";
import { Leaf, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { INGREDIENT_CATEGORY_OPTIONS } from "@/lib/ingredientCategories";
import { CONCERN_CHIP_LABELS, SA_BOTANICAL_TERMS, toggleConcern } from "@/lib/ingredientMatrix";
import { cn } from "@/lib/utils";
import type { IngredientFilters as Filters } from "@/hooks/use-ingredients";

async function fetchConcerns() {
  const { data, error } = await supabase.from("skin_concerns").select("slug, name").order("name");
  if (error) throw error;
  return data ?? [];
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const CHIP = "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]";
const CHIP_ON = "border-foreground bg-foreground text-background";
const CHIP_OFF = "border-border bg-background text-foreground/80 hover:bg-accent";

const IngredientFilters = ({ filters, onChange }: Props) => {
  const { data: concerns } = useQuery({ queryKey: ["skin-concerns"], queryFn: fetchConcerns, staleTime: 60 * 60 * 1000 });
  const selected = filters.concerns ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search ingredients (e.g. vit c, retinol)…"
            className="pl-9"
            aria-label="Search ingredients"
          />
        </div>

        <Select value={filters.category ?? "all"} onValueChange={(v) => onChange({ ...filters, category: v === "all" ? undefined : v })}>
          <SelectTrigger aria-label="Filter by category"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {INGREDIENT_CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.evidence ?? "all"}
          onValueChange={(v) => onChange({ ...filters, evidence: v === "all" ? undefined : (v as Filters["evidence"]) })}
        >
          <SelectTrigger aria-label="Filter by evidence strength"><SelectValue placeholder="Evidence strength" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any evidence level</SelectItem>
            <SelectItem value="strong">Strong</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
            <SelectItem value="anecdotal">Anecdotal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skin concerns (pick any)</legend>
        <div className="flex flex-wrap gap-2">
          {(concerns ?? []).map((c) => {
            const on = selected.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                data-haptic
                onClick={() => onChange({ ...filters, concerns: toggleConcern(selected, c.slug) })}
                className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}
              >
                {CONCERN_CHIP_LABELS[c.slug] ?? c.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">South African relevance</div>
        <button
          type="button"
          aria-pressed={Boolean(filters.saOnly)}
          data-haptic
          onClick={() => onChange({ ...filters, saOnly: !filters.saOnly })}
          className={cn(CHIP, filters.saOnly ? CHIP_ON : CHIP_OFF)}
        >
          <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> Indigenous botanicals
        </button>
        {filters.saOnly && (
          <p className="mt-2 text-xs text-muted-foreground">
            Matches {SA_BOTANICAL_TERMS.slice(0, 6).map((g) => g.label.split(" (")[0]).join(", ")} and other botanicals sourced in southern Africa. Only ingredients already in our catalogue can match.
          </p>
        )}
      </div>
    </div>
  );
};

export default IngredientFilters;
