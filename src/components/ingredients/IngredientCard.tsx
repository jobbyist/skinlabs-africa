import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EvidenceBadge from "./EvidenceBadge";
import { ingredientCategoryLabel } from "@/lib/ingredientCategories";
import type { IngredientSummary } from "@/hooks/use-ingredients";

const IngredientCard = ({ ingredient }: { ingredient: IngredientSummary }) => (
  <Link
    to={`/ingredients/${ingredient.slug}`}
    className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground">
          {ingredient.common_name || ingredient.inci_name}
        </h3>
        {ingredient.common_name && ingredient.common_name !== ingredient.inci_name && (
          <p className="text-xs italic text-muted-foreground">{ingredient.inci_name}</p>
        )}
      </div>
      <Badge variant="outline" className="shrink-0 text-xs">
        {ingredientCategoryLabel(ingredient.category)}
      </Badge>
    </div>

    {ingredient.short_description && (
      <p className="line-clamp-2 text-sm text-muted-foreground">{ingredient.short_description}</p>
    )}

    <div className="mt-auto flex items-center justify-between pt-2">
      <EvidenceBadge level={ingredient.evidence_level} />
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        View profile <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  </Link>
);

export default IngredientCard;
