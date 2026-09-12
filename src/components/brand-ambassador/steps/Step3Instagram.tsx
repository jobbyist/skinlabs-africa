import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOLLOWER_RANGE_OPTIONS, ENGAGEMENT_LEVEL_OPTIONS } from "@/data/brandAmbassador";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const Step3Instagram = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Applicants must have 5,000–50,000 followers on each platform separately. Followers cannot be combined.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ba-ig-username">Instagram username / handle *</Label>
          <Input
            id="ba-ig-username"
            placeholder="@username"
            value={form.igUsername}
            onChange={(e) => onChange("igUsername", e.target.value)}
            aria-invalid={Boolean(errors.igUsername)}
            aria-describedby={errors.igUsername ? "ba-ig-username-error" : undefined}
          />
          {errors.igUsername && <p id="ba-ig-username-error" className="mt-1 text-xs font-medium text-destructive">{errors.igUsername}</p>}
        </div>
        <div>
          <Label htmlFor="ba-ig-url">Instagram profile URL *</Label>
          <Input
            id="ba-ig-url"
            type="url"
            placeholder="https://instagram.com/…"
            value={form.igProfileUrl}
            onChange={(e) => onChange("igProfileUrl", e.target.value)}
            aria-invalid={Boolean(errors.igProfileUrl)}
            aria-describedby={errors.igProfileUrl ? "ba-ig-url-error" : undefined}
          />
          {errors.igProfileUrl && <p id="ba-ig-url-error" className="mt-1 text-xs font-medium text-destructive">{errors.igProfileUrl}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="ba-ig-followers">Instagram follower range *</Label>
        <Select value={form.igFollowerRange} onValueChange={(v) => onChange("igFollowerRange", v)}>
          <SelectTrigger id="ba-ig-followers" aria-invalid={Boolean(errors.igFollowerRange)}>
            <SelectValue placeholder="Select a range" />
          </SelectTrigger>
          <SelectContent>
            {FOLLOWER_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.igFollowerRange && <p className="mt-1 text-xs font-medium text-destructive">{errors.igFollowerRange}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ba-ig-views">Average views per Reel *</Label>
          <Input
            id="ba-ig-views"
            inputMode="numeric"
            placeholder="e.g. 12,000"
            value={form.igAvgViews}
            onChange={(e) => onChange("igAvgViews", e.target.value)}
            aria-invalid={Boolean(errors.igAvgViews)}
            aria-describedby={errors.igAvgViews ? "ba-ig-views-error" : undefined}
          />
          {errors.igAvgViews && <p id="ba-ig-views-error" className="mt-1 text-xs font-medium text-destructive">{errors.igAvgViews}</p>}
        </div>
        <div>
          <Label htmlFor="ba-ig-category">Instagram category (if different)</Label>
          <Input
            id="ba-ig-category"
            placeholder="Optional"
            value={form.igCategory}
            onChange={(e) => onChange("igCategory", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="ba-ig-engagement">Engagement level *</Label>
        <Select value={form.igEngagement} onValueChange={(v) => onChange("igEngagement", v)}>
          <SelectTrigger id="ba-ig-engagement" aria-invalid={Boolean(errors.igEngagement)}>
            <SelectValue placeholder="Select an engagement level" />
          </SelectTrigger>
          <SelectContent>
            {ENGAGEMENT_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.igEngagement && <p className="mt-1 text-xs font-medium text-destructive">{errors.igEngagement}</p>}
      </div>
    </div>
  );
};

export default Step3Instagram;
