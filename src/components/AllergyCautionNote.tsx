import { AlertTriangle } from "lucide-react";

interface AllergyCautionNoteProps {
  matchedTerm: string;
  /** Which ingredient this note is about — omit when the surrounding page
   *  already makes that clear (e.g. an ingredient's own detail page); pass
   *  it when several ingredients could be flagged at once (e.g. a routine
   *  scan), so each note stays unambiguous. */
  ingredientName?: string;
}

/** Advisory-only note shown when an ingredient the visitor is viewing
 *  matches something in their self-reported profiles.allergies. Never a
 *  diagnosis, never a hard block — just a prompt to double-check, matching
 *  this app's standing medical-guardrail conventions (cosmetic language
 *  only, "consult a dermatologist" rather than any assertion of harm). */
const AllergyCautionNote = ({ matchedTerm, ingredientName }: AllergyCautionNoteProps) => (
  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
    <p>
      You've noted a possible sensitivity to something matching "{matchedTerm}" on your profile
      {ingredientName ? ` — this appears in ${ingredientName}` : ""}. Worth discussing
      {ingredientName ? ` ${ingredientName}` : " this ingredient"} with a dermatologist before use.
    </p>
  </div>
);

export default AllergyCautionNote;
