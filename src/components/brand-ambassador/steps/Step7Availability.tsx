import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CONTENT_FREQUENCY_OPTIONS, BA_PROGRAMME_START } from "@/data/brandAmbassador";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const Step7Availability = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Available from {BA_PROGRAMME_START} for the initial 3-month programme? *
        </legend>
        <RadioGroup
          value={form.availableFromOct1}
          onValueChange={(v) => onChange("availableFromOct1", v as "yes" | "no")}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="yes" id="ba-avail-yes" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="no" id="ba-avail-no" /> No
          </label>
        </RadioGroup>
        {errors.availableFromOct1 && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.availableFromOct1}</p>}
      </fieldset>

      <div>
        <Label htmlFor="ba-frequency">Content frequency *</Label>
        <Select value={form.contentFrequency} onValueChange={(v) => onChange("contentFrequency", v)}>
          <SelectTrigger id="ba-frequency" aria-invalid={Boolean(errors.contentFrequency)}>
            <SelectValue placeholder="Select a frequency" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_FREQUENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contentFrequency && <p className="mt-1 text-xs font-medium text-destructive">{errors.contentFrequency}</p>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Comfortable working toward performance targets? *
        </legend>
        <RadioGroup
          value={form.comfortableTargets}
          onValueChange={(v) => onChange("comfortableTargets", v as "yes" | "no")}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="yes" id="ba-targets-yes" /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <RadioGroupItem value="no" id="ba-targets-no" /> No
          </label>
        </RadioGroup>
        {errors.comfortableTargets && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{errors.comfortableTargets}</p>}
      </fieldset>

      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Specific quotas will be defined in the official programme terms. Meeting them may support consideration for
        a future 12-month partnership, but does not guarantee an offer.
      </p>
    </div>
  );
};

export default Step7Availability;
