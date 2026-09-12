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

const Step2TikTok = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        TikTok eligibility is assessed separately from Instagram — your TikTok following alone must fall between
        5,000 and 50,000 followers.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ba-tt-username">TikTok username *</Label>
          <Input
            id="ba-tt-username"
            placeholder="@username"
            value={form.tiktokUsername}
            onChange={(e) => onChange("tiktokUsername", e.target.value)}
            aria-invalid={Boolean(errors.tiktokUsername)}
            aria-describedby={errors.tiktokUsername ? "ba-tt-username-error" : undefined}
          />
          {errors.tiktokUsername && <p id="ba-tt-username-error" className="mt-1 text-xs font-medium text-destructive">{errors.tiktokUsername}</p>}
        </div>
        <div>
          <Label htmlFor="ba-tt-url">TikTok profile URL *</Label>
          <Input
            id="ba-tt-url"
            type="url"
            placeholder="https://tiktok.com/@…"
            value={form.tiktokProfileUrl}
            onChange={(e) => onChange("tiktokProfileUrl", e.target.value)}
            aria-invalid={Boolean(errors.tiktokProfileUrl)}
            aria-describedby={errors.tiktokProfileUrl ? "ba-tt-url-error" : undefined}
          />
          {errors.tiktokProfileUrl && <p id="ba-tt-url-error" className="mt-1 text-xs font-medium text-destructive">{errors.tiktokProfileUrl}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="ba-tt-followers">TikTok follower range *</Label>
        <Select value={form.tiktokFollowerRange} onValueChange={(v) => onChange("tiktokFollowerRange", v)}>
          <SelectTrigger id="ba-tt-followers" aria-invalid={Boolean(errors.tiktokFollowerRange)}>
            <SelectValue placeholder="Select a range" />
          </SelectTrigger>
          <SelectContent>
            {FOLLOWER_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tiktokFollowerRange && <p className="mt-1 text-xs font-medium text-destructive">{errors.tiktokFollowerRange}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ba-tt-niche">Niche / category *</Label>
          <Input
            id="ba-tt-niche"
            placeholder="e.g. Skincare, beauty, lifestyle"
            value={form.tiktokNiche}
            onChange={(e) => onChange("tiktokNiche", e.target.value)}
            aria-invalid={Boolean(errors.tiktokNiche)}
            aria-describedby={errors.tiktokNiche ? "ba-tt-niche-error" : undefined}
          />
          {errors.tiktokNiche && <p id="ba-tt-niche-error" className="mt-1 text-xs font-medium text-destructive">{errors.tiktokNiche}</p>}
        </div>
        <div>
          <Label htmlFor="ba-tt-views">Average views per TikTok *</Label>
          <Input
            id="ba-tt-views"
            inputMode="numeric"
            placeholder="e.g. 15,000"
            value={form.tiktokAvgViews}
            onChange={(e) => onChange("tiktokAvgViews", e.target.value)}
            aria-invalid={Boolean(errors.tiktokAvgViews)}
            aria-describedby={errors.tiktokAvgViews ? "ba-tt-views-error" : undefined}
          />
          {errors.tiktokAvgViews && <p id="ba-tt-views-error" className="mt-1 text-xs font-medium text-destructive">{errors.tiktokAvgViews}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="ba-tt-engagement">Engagement level *</Label>
        <Select value={form.tiktokEngagement} onValueChange={(v) => onChange("tiktokEngagement", v)}>
          <SelectTrigger id="ba-tt-engagement" aria-invalid={Boolean(errors.tiktokEngagement)}>
            <SelectValue placeholder="Select an engagement level" />
          </SelectTrigger>
          <SelectContent>
            {ENGAGEMENT_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tiktokEngagement && <p className="mt-1 text-xs font-medium text-destructive">{errors.tiktokEngagement}</p>}
      </div>

      <div>
        <Label htmlFor="ba-tt-other">Other profile links (optional)</Label>
        <Input
          id="ba-tt-other"
          placeholder="YouTube, blog, portfolio…"
          value={form.tiktokOtherLinks}
          onChange={(e) => onChange("tiktokOtherLinks", e.target.value)}
        />
      </div>
    </div>
  );
};

export default Step2TikTok;
