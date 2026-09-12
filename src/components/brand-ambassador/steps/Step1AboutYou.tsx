import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AmbassadorFormData, FormErrors } from "../formTypes";

interface StepProps {
  form: AmbassadorFormData;
  errors: FormErrors;
  onChange: <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => void;
}

const Step1AboutYou = ({ form, errors, onChange }: StepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ba-fullName">Full name *</Label>
        <Input
          id="ba-fullName"
          value={form.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "ba-fullName-error" : undefined}
          autoComplete="name"
        />
        {errors.fullName && <p id="ba-fullName-error" className="mt-1 text-xs font-medium text-destructive">{errors.fullName}</p>}
      </div>

      <div>
        <Label htmlFor="ba-email">Email *</Label>
        <Input
          id="ba-email"
          type="email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "ba-email-error" : undefined}
          autoComplete="email"
        />
        {errors.email && <p id="ba-email-error" className="mt-1 text-xs font-medium text-destructive">{errors.email}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ba-phone">Phone number *</Label>
          <Input
            id="ba-phone"
            type="tel"
            placeholder="+27 …"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "ba-phone-error" : undefined}
            autoComplete="tel"
          />
          {errors.phone && <p id="ba-phone-error" className="mt-1 text-xs font-medium text-destructive">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="ba-country">Country *</Label>
          <Input
            id="ba-country"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "ba-country-error" : undefined}
            autoComplete="country-name"
          />
          {errors.country && <p id="ba-country-error" className="mt-1 text-xs font-medium text-destructive">{errors.country}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="ba-cityProvince">City / province *</Label>
        <Input
          id="ba-cityProvince"
          value={form.cityProvince}
          onChange={(e) => onChange("cityProvince", e.target.value)}
          aria-invalid={Boolean(errors.cityProvince)}
          aria-describedby={errors.cityProvince ? "ba-cityProvince-error" : undefined}
          autoComplete="address-level2"
        />
        {errors.cityProvince && <p id="ba-cityProvince-error" className="mt-1 text-xs font-medium text-destructive">{errors.cityProvince}</p>}
      </div>
    </div>
  );
};

export default Step1AboutYou;
