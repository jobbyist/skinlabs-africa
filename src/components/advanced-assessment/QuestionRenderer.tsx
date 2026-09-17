import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { AssessmentQuestion, ProductListEntry } from "@/lib/assessment/types";

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
  switch (question.type) {
    case "single_select": {
      const selected = typeof value === "string" ? value : undefined;
      return (
        <RadioGroup value={selected} onValueChange={onChange} className="grid gap-2.5 sm:grid-cols-2">
          {question.options?.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`${question.id}-${opt.value}`}
              className={
                "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors " +
                (selected === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
              }
            >
              <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
              <span className="text-sm">{opt.label}</span>
            </Label>
          ))}
        </RadioGroup>
      );
    }

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (optValue: string) => {
        const next = selected.includes(optValue) ? selected.filter((v) => v !== optValue) : [...selected, optValue];
        onChange(next);
      };
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {question.options?.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <Label
                key={opt.value}
                htmlFor={`${question.id}-${opt.value}`}
                className={
                  "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors " +
                  (checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
                }
              >
                <Checkbox id={`${question.id}-${opt.value}`} checked={checked} onCheckedChange={() => toggle(opt.value)} />
                <span className="text-sm">{opt.label}</span>
              </Label>
            );
          })}
        </div>
      );
    }

    case "scale": {
      const min = question.min ?? 1;
      const max = question.max ?? 5;
      const current = typeof value === "number" ? value : Math.round((min + max) / 2);
      return (
        <div className="px-2 space-y-3">
          <Slider min={min} max={max} step={1} value={[current]} onValueChange={([v]) => onChange(v)} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{question.minLabel ?? min}</span>
            <span className="font-medium text-foreground">{current}</span>
            <span>{question.maxLabel ?? max}</span>
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
          className="min-h-24"
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
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" onClick={add}>
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
