import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const Step5Content = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ba-audience">Describe your content and audience *</Label>
        <Textarea
          id="ba-audience"
          rows={3}
          value={form.audienceDescription}
          onChange={(e) => onChange("audienceDescription", e.target.value)}
          aria-invalid={Boolean(errors.audienceDescription)}
          aria-describedby={errors.audienceDescription ? "ba-audience-error" : undefined}
        />
        {errors.audienceDescription && <p id="ba-audience-error" className="mt-1 text-xs font-medium text-destructive">{errors.audienceDescription}</p>}
      </div>

      <div>
        <Label htmlFor="ba-fit">Why SkinLabs® fits your audience *</Label>
        <Textarea
          id="ba-fit"
          rows={3}
          value={form.whySkinlabsFit}
          onChange={(e) => onChange("whySkinlabsFit", e.target.value)}
          aria-invalid={Boolean(errors.whySkinlabsFit)}
          aria-describedby={errors.whySkinlabsFit ? "ba-fit-error" : undefined}
        />
        {errors.whySkinlabsFit && <p id="ba-fit-error" className="mt-1 text-xs font-medium text-destructive">{errors.whySkinlabsFit}</p>}
      </div>

      <div>
        <Label htmlFor="ba-introduce">How would you introduce SkinLabs® on TikTok and Instagram? *</Label>
        <Textarea
          id="ba-introduce"
          rows={3}
          value={form.howIntroduce}
          onChange={(e) => onChange("howIntroduce", e.target.value)}
          aria-invalid={Boolean(errors.howIntroduce)}
          aria-describedby={errors.howIntroduce ? "ba-introduce-error" : undefined}
        />
        {errors.howIntroduce && <p id="ba-introduce-error" className="mt-1 text-xs font-medium text-destructive">{errors.howIntroduce}</p>}
      </div>

      <div>
        <Label htmlFor="ba-tt-examples">2–3 TikTok content examples *</Label>
        <Textarea
          id="ba-tt-examples"
          rows={3}
          placeholder="Paste links or short descriptions, one per line"
          value={form.tiktokExamples}
          onChange={(e) => onChange("tiktokExamples", e.target.value)}
          aria-invalid={Boolean(errors.tiktokExamples)}
          aria-describedby={errors.tiktokExamples ? "ba-tt-examples-error" : undefined}
        />
        {errors.tiktokExamples && <p id="ba-tt-examples-error" className="mt-1 text-xs font-medium text-destructive">{errors.tiktokExamples}</p>}
      </div>

      <div>
        <Label htmlFor="ba-ig-examples">2–3 Instagram content examples *</Label>
        <Textarea
          id="ba-ig-examples"
          rows={3}
          placeholder="Paste links or short descriptions, one per line"
          value={form.igExamples}
          onChange={(e) => onChange("igExamples", e.target.value)}
          aria-invalid={Boolean(errors.igExamples)}
          aria-describedby={errors.igExamples ? "ba-ig-examples-error" : undefined}
        />
        {errors.igExamples && <p id="ba-ig-examples-error" className="mt-1 text-xs font-medium text-destructive">{errors.igExamples}</p>}
      </div>
    </div>
  );
};

export default Step5Content;
