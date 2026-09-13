import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { INGREDIENT_CATEGORY_OPTIONS } from "@/lib/ingredientCategories";
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

const IngredientFilters = ({ filters, onChange }: Props) => {
  const { data: concerns } = useQuery({ queryKey: ["skin-concerns"], queryFn: fetchConcerns, staleTime: 60 * 60 * 1000 });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search ingredients (e.g. vit c, retinol)…"
          className="pl-9"
          aria-label="Search ingredients"
        />
      </div>

      <Select
        value={filters.category ?? "all"}
        onValueChange={(v) => onChange({ ...filters, category: v === "all" ? undefined : v })}
      >
        <SelectTrigger aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {INGREDIENT_CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.concernSlug ?? "all"}
        onValueChange={(v) => onChange({ ...filters, concernSlug: v === "all" ? undefined : v })}
      >
        <SelectTrigger aria-label="Filter by skin concern">
          <SelectValue placeholder="Skin concern" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All concerns</SelectItem>
          {(concerns ?? []).map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.evidence ?? "all"}
        onValueChange={(v) => onChange({ ...filters, evidence: v === "all" ? undefined : (v as Filters["evidence"]) })}
      >
        <SelectTrigger aria-label="Filter by evidence strength">
          <SelectValue placeholder="Evidence strength" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any evidence level</SelectItem>
          <SelectItem value="strong">Strong</SelectItem>
          <SelectItem value="moderate">Moderate</SelectItem>
          <SelectItem value="limited">Limited</SelectItem>
          <SelectItem value="anecdotal">Anecdotal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default IngredientFilters;
