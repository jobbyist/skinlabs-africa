import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const Step4Analytics = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        We verify audience analytics for both platforms — follower count, audience location, age range, reach/views
        and engagement help us confirm an authentic South African audience. Share a link to your analytics for each
        platform: your platform's own shareable analytics link if it has one, or a screenshot uploaded somewhere
        with link-sharing turned on (Google Drive, Dropbox, Imgur, etc.). We will never ask for your password or
        account credentials.
      </p>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">TikTok analytics</p>
        <div>
          <Label htmlFor="ba-tt-analytics-url">TikTok analytics verification link *</Label>
          <p className="mb-1 text-xs text-muted-foreground">
            Your Creator Tools → Analytics overview, showing followers, audience and views.
          </p>
          <Input
            id="ba-tt-analytics-url"
            type="url"
            placeholder="https://…"
            value={form.tiktokAnalyticsUrl}
            onChange={(e) => onChange("tiktokAnalyticsUrl", e.target.value)}
            aria-invalid={Boolean(errors.tiktokAnalytics)}
            aria-describedby={errors.tiktokAnalytics ? "ba-tt-analytics-url-error" : undefined}
          />
        </div>
        {errors.tiktokAnalytics && (
          <p id="ba-tt-analytics-url-error" role="alert" className="text-xs font-medium text-destructive">{errors.tiktokAnalytics}</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Instagram analytics</p>
        <div>
          <Label htmlFor="ba-ig-analytics-url">Instagram analytics verification link *</Label>
          <p className="mb-1 text-xs text-muted-foreground">
            Your Professional Dashboard → Insights overview, showing followers, audience and reach.
          </p>
          <Input
            id="ba-ig-analytics-url"
            type="url"
            placeholder="https://…"
            value={form.igAnalyticsUrl}
            onChange={(e) => onChange("igAnalyticsUrl", e.target.value)}
            aria-invalid={Boolean(errors.igAnalytics)}
            aria-describedby={errors.igAnalytics ? "ba-ig-analytics-url-error" : undefined}
          />
        </div>
        {errors.igAnalytics && (
          <p id="ba-ig-analytics-url-error" role="alert" className="text-xs font-medium text-destructive">{errors.igAnalytics}</p>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
        <Checkbox
          checked={form.analyticsConfirmed}
          onCheckedChange={(checked) => onChange("analyticsConfirmed", checked === true)}
          aria-invalid={Boolean(errors.analyticsConfirmed)}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground">
          I confirm that the audience analytics information and supporting evidence submitted for TikTok and
          Instagram is accurate and current. *
        </span>
      </label>
      {errors.analyticsConfirmed && <p role="alert" className="text-xs font-medium text-destructive">{errors.analyticsConfirmed}</p>}
    </div>
  );
};

export default Step4Analytics;
