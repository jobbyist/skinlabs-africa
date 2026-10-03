import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { AssessmentQuestion, ProductListEntry } from "@/lib/assessment/types";
import { MST_SCALE } from "@/data/mstScale";

/** Full-width answer card. The real radio/checkbox sits before it as a visually
 *  hidden `peer`, so keyboard focus and the checked state style the card. */
const optionCard =
  "flex min-h-14 cursor-pointer items-center gap-4 rounded-[1.75rem] border-2 border-border bg-card px-4 py-3 shadow-xs transition-[border-color,background-color,transform] duration-150 ease-out hover:border-primary/40 active:scale-[0.99] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

const LetterBadge = ({ index, checked }: { index: number; checked: boolean }) => (
  <span
    aria-hidden="true"
    className={
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors " +
      (checked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")
    }
  >
    {String.fromCharCode(65 + (index % 26))}
  </span>
);

interface QuestionRendererProps {
  question: AssessmentQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Renders one question by type (section 7/30). Kept as plain, generous-
 * whitespace option cards rather than a dense form grid — this is meant to
 * feel like a considered profile-building step, not a generic SaaS form.
 */
const QuestionRenderer = ({ question, value, onChange }: QuestionRendererProps) => {
  // Monk Skin Tone is chosen from real swatches, never from a word label.
  if (question.id === "mst_tone") {
    const selected = typeof value === "string" ? value : undefined;
    return (
      <div role="radiogroup" aria-label={question.prompt} className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
        {MST_SCALE.map((swatch) => {
          const v = String(swatch.level);
          const isSelected = selected === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Monk ${swatch.level}`}
              onClick={() => onChange(v)}
              className={
                "flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-colors " +
                (isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
              }
            >
              <span className="h-10 w-10 rounded-full border border-black/10" style={{ backgroundColor: swatch.hex }} />
              <span className="text-xs text-muted-foreground">{swatch.level}</span>
            </button>
          );
        })}
      </div>
    );
  }

  switch (question.type) {
    // `frequency` has the same shape as a single choice (a list of options).
    case "frequency":
    case "single_select": {
      const selected = typeof value === "string" ? value : undefined;
      return (
        <RadioGroup value={selected} onValueChange={onChange} aria-label={question.prompt} className="grid gap-3">
          {question.options?.map((opt, idx) => {
            const id = `${question.id}-${opt.value}`;
            const checked = selected === opt.value;
            return (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={id} className="peer sr-only" />
                <Label htmlFor={id} className={optionCard}>
                  <LetterBadge index={idx} checked={checked} />
                  <span className="flex-1 text-[15px] font-medium leading-snug">{opt.label}</span>
                  <span
                    aria-hidden="true"
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
                      (checked ? "border-primary" : "border-muted-foreground/30")
                    }
                  >
                    {checked && <span className="h-3 w-3 rounded-full bg-primary" />}
                  </span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      );
    }

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const atMax = question.maxSelections != null && selected.length >= question.maxSelections;
      const toggle = (optValue: string) => {
        const next = selected.includes(optValue) ? selected.filter((v) => v !== optValue) : [...selected, optValue];
        onChange(next);
      };
      return (
        <div className="space-y-3">
          {question.maxSelections != null && (
            <p className="text-center text-xs text-muted-foreground">
              Choose up to {question.maxSelections} · {selected.length} selected
            </p>
          )}
          <div className="grid gap-3" role="group" aria-label={question.prompt}>
            {question.options?.map((opt, idx) => {
              const id = `${question.id}-${opt.value}`;
              const checked = selected.includes(opt.value);
              return (
                <div key={opt.value}>
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={!checked && atMax}
                    onCheckedChange={() => toggle(opt.value)}
                    className="peer sr-only"
                  />
                  <Label htmlFor={id} className={optionCard}>
                    <LetterBadge index={idx} checked={checked} />
                    <span className="flex-1 text-[15px] font-medium leading-snug">{opt.label}</span>
                    <span
                      aria-hidden="true"
                      className={
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors " +
                        (checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")
                      }
                    >
                      {checked && <Check className="h-4 w-4" />}
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "scale": {
      const min = question.min ?? 1;
      const max = question.max ?? 5;
      const current = typeof value === "number" ? value : Math.round((min + max) / 2);
      return (
        <div className="space-y-5 rounded-3xl border-2 border-border bg-card px-5 py-6">
          <p className="text-center font-heading text-4xl font-bold tabular-nums" aria-hidden="true">
            {typeof value === "number" ? current : "–"}
          </p>
          <Slider min={min} max={max} step={1} value={[current]} onValueChange={([v]) => onChange(v)} aria-label={question.prompt} />
          <div className="flex justify-between gap-4 text-sm text-muted-foreground">
            <span>{question.minLabel ?? min}</span>
            <span className="text-right">{question.maxLabel ?? max}</span>
          </div>
        </div>
      );
    }

    case "text": {
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-32 rounded-2xl border-2 px-4 py-3 text-base"
        />
      );
    }

    case "product_list": {
      const entries = Array.isArray(value) ? (value as ProductListEntry[]) : [];
      return <ProductListInput entries={entries} onChange={onChange} />;
    }

    default:
      return null;
  }
};

/**
 * Simple, real (no fabricated catalogue matching) name-only product list —
 * a deliberate v1 scope reduction. Referencing SkinLabs' actual reviewed
 * product catalogue (section 6's "where possible") is a documented future
 * enhancement, not something invented here without real search wired up.
 */
const ProductListInput = ({ entries, onChange }: { entries: ProductListEntry[]; onChange: (v: ProductListEntry[]) => void }) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([...entries, { productName: name }]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="e.g. CeraVe Foaming Cleanser"
          className="h-12 min-w-0 flex-1 rounded-full border-2 border-input bg-background px-4 text-base"
        />
        <Button type="button" variant="outline" onClick={add} className="h-12 rounded-full px-5">
          Add
        </Button>
      </div>
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry, idx) => (
            <Badge key={`${entry.productName}-${idx}`} variant="secondary" className="gap-1.5">
              {entry.productName}
              <button type="button" onClick={() => onChange(entries.filter((_, i) => i !== idx))} aria-label={`Remove ${entry.productName}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
