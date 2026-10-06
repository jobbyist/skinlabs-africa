import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Coverage = {
  ingredients: number;
  pairs: number;
  curated_pairs: number;
  class_rules: number;
  uncategorised: { slug: string; name: string }[];
  categories_without_any_rule: string[];
};

/**
 * Combination Checker coverage (admin_ingredient_pair_note_coverage). Every pair gets a note from the ingredients'
 * categories, so a new ingredient only needs a category; this flags the ones that don't have one yet.
 */
const PairNoteCoverageCard = () => {
  const [data, setData] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: res, error: err } = await supabase.rpc("admin_ingredient_pair_note_coverage");
      if (err) setError(err.message);
      else setData(res as unknown as Coverage);
    })();
  }, []);

  if (error) return <Card className="mb-4"><CardContent className="p-4 text-sm text-destructive" role="alert">Combination checker coverage unavailable: {error}</CardContent></Card>;
  if (!data) return null;
  const needsAttention = data.uncategorised.length > 0 || data.categories_without_any_rule.length > 0;
  return (
    <Card className="mb-4">
      <CardContent className="space-y-1.5 p-4 text-sm">
        <p className="font-medium text-card-foreground">Combination checker coverage</p>
        <p className="text-muted-foreground">
          {data.pairs.toLocaleString("en-ZA")} ingredient pairs across {data.ingredients} ingredients: {data.curated_pairs} have a cited note, the rest use class
          guidance ({data.class_rules} rules) or say nothing is on record.
        </p>
        {needsAttention ? (
          <p className="text-amber-600 dark:text-amber-400">
            {data.uncategorised.length > 0 && <>Set a category on: {data.uncategorised.map((u) => u.name).join(", ")}. </>}
            {data.categories_without_any_rule.length > 0 && <>No class rule yet for: {data.categories_without_any_rule.join(", ")}.</>}
          </p>
        ) : (
          <p className="text-muted-foreground">Every ingredient has a category.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PairNoteCoverageCard;
