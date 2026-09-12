import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PARTNERSHIP_INTEREST_OPTIONS } from "@/data/brandAmbassador";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const ALL_VALUES = PARTNERSHIP_INTEREST_OPTIONS.filter((o) => o.value !== "all").map((o) => o.value);

const Step6Partnership = ({ form, errors, onChange }: StepProps) => {
  const toggleInterest = (value: string) => {
    if (value === "all") {
      const hasAll = ALL_VALUES.every((v) => form.interests.includes(v));
      onChange("interests", hasAll ? [] : [...ALL_VALUES, "all"]);
      return;
    }
    const next = form.interests.includes(value)
      ? form.interests.filter((v) => v !== value && v !== "all")
      : [...form.interests.filter((v) => v !== "all"), value];
    onChange("interests", next);
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          What are you interested in? Select all that apply. *
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PARTNERSHIP_INTEREST_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-secondary/40">
              <Checkbox checked={form.interests.includes(opt.value)} onCheckedChange={() => toggleInterest(opt.value)} />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.interests && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.interests}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Comfortable creating TikTok and Instagram content? *
        </legend>
        <RadioGroup
          value={form.comfortableContent}
          onValueChange={(v) => onChange("comfortableContent", v as "yes" | "no")}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="yes" id="ba-content-yes" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="no" id="ba-content-no" /> No
          </label>
        </RadioGroup>
        {errors.comfortableContent && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.comfortableContent}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Comfortable using a referral link/code? *
        </legend>
        <RadioGroup
          value={form.comfortableReferral}
          onValueChange={(v) => onChange("comfortableReferral", v as "yes" | "no")}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="yes" id="ba-referral-yes" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="no" id="ba-referral-no" /> No
          </label>
        </RadioGroup>
        {errors.comfortableReferral && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.comfortableReferral}</p>}
      </fieldset>
    </div>
  );
};

export default Step6Partnership;
