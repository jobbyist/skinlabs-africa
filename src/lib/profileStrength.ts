/**
 * "Profile strength" is a broader, purely encouragement-oriented completeness
 * score shown as a ring/progress bar on the dashboard — distinct from
 * `useProfileComplete()` / `is_profile_complete()`, which is the narrower,
 * strictly-enforced gate for commenting and the AI Formulator. This score
 * folds in optional fields too (address, allergies, routine time) so the
 * dashboard can nudge a member toward a richer profile without changing what
 * "complete enough to comment" means.
 */

export interface ProfileStrengthInput {
  username: string | null;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  skin_color: string | null;
  address_line1: string | null;
  city: string | null;
  allergies: string[] | null;
  skin_conditions: string[] | null;
  preferred_routine_time: string | null;
}

interface FieldCheck {
  key: keyof ProfileStrengthInput;
  label: string;
}

const FIELDS: FieldCheck[] = [
  { key: "username", label: "Username" },
  { key: "full_name", label: "Full name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "skin_color", label: "Skin type (Fitzpatrick)" },
  { key: "phone", label: "Phone number" },
  { key: "gender", label: "Gender" },
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "allergies", label: "Allergies" },
  { key: "skin_conditions", label: "Skin conditions" },
  { key: "preferred_routine_time", label: "Preferred routine time" },
];

const isFilled = (value: string | string[] | null | undefined): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value && value.trim());

export interface ProfileStrength {
  percent: number;
  filledCount: number;
  totalCount: number;
  missingLabels: string[];
}

export const computeProfileStrength = (profile: Partial<ProfileStrengthInput> | null): ProfileStrength => {
  if (!profile) {
    return { percent: 0, filledCount: 0, totalCount: FIELDS.length, missingLabels: FIELDS.map((f) => f.label) };
  }
  const missing: string[] = [];
  let filled = 0;
  for (const field of FIELDS) {
    if (isFilled(profile[field.key] as string | string[] | null | undefined)) filled += 1;
    else missing.push(field.label);
  }
  return {
    percent: Math.round((filled / FIELDS.length) * 100),
    filledCount: filled,
    totalCount: FIELDS.length,
    missingLabels: missing,
  };
};
