/**
 * Builds the sanitised, minimal profile context sent to Claude — section 24
 * ("Privacy and security") of the engine brief. Reuses profiles.date_of_birth/
 * city/province (already collected elsewhere in the app) instead of asking
 * the assessment to re-collect age/location, and reduces DOB to a coarse
 * age RANGE — the model never sees an exact birthdate, name, email, phone,
 * user id, or auth token.
 */
import type { SanitizedUserProfile } from "./types.ts";

export function ageRangeFromDateOfBirth(dateOfBirth: string | null | undefined): SanitizedUserProfile["ageRange"] {
  if (!dateOfBirth) return "unspecified";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "unspecified";

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;

  if (age < 18) return "under_18";
  if (age <= 24) return "18_24";
  if (age <= 34) return "25_34";
  if (age <= 44) return "35_44";
  if (age <= 54) return "45_54";
  return "55_plus";
}

export function buildSanitizedProfile(input: {
  dateOfBirth: string | null;
  city: string | null;
  province: string | null;
  membershipTier: SanitizedUserProfile["membershipTier"];
}): SanitizedUserProfile {
  return {
    ageRange: ageRangeFromDateOfBirth(input.dateOfBirth),
    city: input.city,
    province: input.province,
    membershipTier: input.membershipTier,
  };
}
