import { Shield } from "lucide-react";

/** Standard medical disclaimer for the Ingredients Intelligence Layer — same
 *  register as SKYNN AI's disclaimer in AIFormulator.tsx, so the platform
 *  speaks with one voice on "this is not medical advice". */
const IngredientDisclaimer = ({ className }: { className?: string }) => (
  <div className={className ?? "rounded-2xl border border-border bg-muted/40 p-4"}>
    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
      <Shield className="h-4 w-4" />
      Important disclaimer
    </div>
    <p className="text-xs text-muted-foreground">
      This page provides general skincare information and is <strong>not medical advice, diagnosis or
      treatment</strong>. Ingredient interactions and evidence summaries reflect published, cited sources —
      not a personal assessment of your skin. For medical skin conditions, rashes, pregnancy/lactation
      questions or persistent concerns, please consult a licensed dermatologist or HPCSA-registered
      practitioner.
    </p>
  </div>
);

export default IngredientDisclaimer;
