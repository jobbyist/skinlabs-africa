import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { BA_PROGRAMME_LENGTH, BA_TOP_PERFORMER_SPOTS } from "@/data/brandAmbassador";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const AgreementRow = ({
  id,
  checked,
  onCheckedChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) => (
  <div>
    <label htmlFor={id} className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} aria-invalid={Boolean(error)} className="mt-0.5" />
      <span className="text-sm text-foreground">{children}</span>
    </label>
    {error && <p role="alert" className="mt-1 pl-3 text-xs font-medium text-destructive">{error}</p>}
  </div>
);

const Step8Agreement = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-3">
      <AgreementRow id="ba-agree-accurate" checked={form.agreeAccurateInfo} onCheckedChange={(c) => onChange("agreeAccurateInfo", c)} error={errors.agreeAccurateInfo}>
        I confirm the information in this application is accurate, and that TikTok and Instagram eligibility is assessed separately. *
      </AgreementRow>

      <AgreementRow id="ba-agree-noguarantee" checked={form.agreeNoGuarantee} onCheckedChange={(c) => onChange("agreeNoGuarantee", c)} error={errors.agreeNoGuarantee}>
        I understand that submitting this application does not guarantee selection. *
      </AgreementRow>

      <AgreementRow id="ba-agree-analytics" checked={form.agreeAnalyticsAccurate} onCheckedChange={(c) => onChange("agreeAnalyticsAccurate", c)} error={errors.agreeAnalyticsAccurate}>
        I confirm the analytics evidence I've submitted is accurate and current. *
      </AgreementRow>

      <AgreementRow id="ba-agree-length" checked={form.agreeProgrammeLength} onCheckedChange={(c) => onChange("agreeProgrammeLength", c)} error={errors.agreeProgrammeLength}>
        I understand the initial programme lasts {BA_PROGRAMME_LENGTH}, and that any future 12-month partnership is
        limited to up to {BA_TOP_PERFORMER_SPOTS} eligible top performers and is not guaranteed. *
      </AgreementRow>

      <AgreementRow id="ba-agree-terms" checked={form.agreeReviewTerms} onCheckedChange={(c) => onChange("agreeReviewTerms", c)} error={errors.agreeReviewTerms}>
        I agree to review the official programme terms and conditions if selected. See our{" "}
        <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">
          Terms of Service
        </Link>{" "}
        — full Brand Ambassador Programme terms will be shared with selected applicants. *
      </AgreementRow>
    </div>
  );
};

export default Step8Agreement;
