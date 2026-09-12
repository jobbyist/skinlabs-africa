import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FileUploadField from "../FileUploadField";
import type { AmbassadorFormData, AmbassadorFormFiles, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  files: AmbassadorFormFiles;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
  onFileChange: <K extends keyof AmbassadorFormFiles>(field: K, file: File | null) => void;
}

const Step4Analytics = ({ form, files, errors, onChange, onFileChange }: StepProps) => {
  const [tiktokUploadError, setTiktokUploadError] = useState<string>();
  const [igUploadError, setIgUploadError] = useState<string>();

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        We verify audience analytics for both platforms — follower count, audience location, age range, reach/views
        and engagement help us confirm an authentic South African audience. Upload a screenshot from your
        creator/analytics dashboard, or share a link if that's easier. We will never ask for your password or
        account credentials.
      </p>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">TikTok analytics</p>
        <FileUploadField
          label="TikTok analytics screenshot"
          description="Your Creator Tools → Analytics overview, showing followers, audience and views."
          file={files.tiktokAnalyticsFile}
          onChange={(file, error) => {
            onFileChange("tiktokAnalyticsFile", file);
            setTiktokUploadError(error);
          }}
          error={tiktokUploadError}
        />
        <div>
          <Label htmlFor="ba-tt-analytics-url">Or a TikTok analytics verification link</Label>
          <Input
            id="ba-tt-analytics-url"
            type="url"
            placeholder="https://…"
            value={form.tiktokAnalyticsUrl}
            onChange={(e) => onChange("tiktokAnalyticsUrl", e.target.value)}
          />
        </div>
        {errors.tiktokAnalytics && (
          <p role="alert" className="text-xs font-medium text-destructive">{errors.tiktokAnalytics}</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Instagram analytics</p>
        <FileUploadField
          label="Instagram analytics screenshot"
          description="Your Professional Dashboard → Insights overview, showing followers, audience and reach."
          file={files.igAnalyticsFile}
          onChange={(file, error) => {
            onFileChange("igAnalyticsFile", file);
            setIgUploadError(error);
          }}
          error={igUploadError}
        />
        <div>
          <Label htmlFor="ba-ig-analytics-url">Or an Instagram analytics verification link</Label>
          <Input
            id="ba-ig-analytics-url"
            type="url"
            placeholder="https://…"
            value={form.igAnalyticsUrl}
            onChange={(e) => onChange("igAnalyticsUrl", e.target.value)}
          />
        </div>
        {errors.igAnalytics && (
          <p role="alert" className="text-xs font-medium text-destructive">{errors.igAnalytics}</p>
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
