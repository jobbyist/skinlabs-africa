/**
 * SkinLabs® Academy — approved vocabulary and the accreditation-claim guard.
 *
 * Until a verified, in-date accreditation record exists (academy_accreditations.status = 'verified',
 * returned only by academy_public_accreditation()), nothing user-facing may claim SAQA / NQF / QCTO / SETA /
 * CPD accreditation, a "qualification" or a "diploma". The allowed wording below is what to use instead.
 * The regex is mirrored in academy_validate_version() (SQL); academyTerminology.test.ts keeps both in sync.
 */

export const ACADEMY_NAME = "SkinLabs® Academy";
export const ACADEMY_CERTIFICATE_NAME = "SkinLabs Academy Certificate of Completion";

/** Safe descriptors while nothing is verified. */
export const ACADEMY_ALLOWED_DESCRIPTORS = [
  "SkinLabs Academy Certificate of Completion",
  "certificate of completion",
  "professional development course",
  "accreditation-ready curriculum",
] as const;

/** Same pattern as the publish gate in 20261007100000_academy_foundations.sql (case-insensitive, word-bounded). */
export const ACCREDITATION_CLAIM_SOURCE = "\\b(saqa|nqf|qcto|seta|cpd|accredit[a-z]*|diploma|qualification)\\b";
export const ACCREDITATION_CLAIM_PATTERN = new RegExp(ACCREDITATION_CLAIM_SOURCE, "gi");

/** Terms found in `text` that would read as an accreditation or qualification claim ("accreditation-ready" is allowed). */
export const findAccreditationClaims = (text: string): string[] => {
  const cleaned = text.replace(/accreditation-ready/gi, " ");
  const hits = cleaned.match(ACCREDITATION_CLAIM_PATTERN) ?? [];
  return [...new Set(hits.map((h) => h.toLowerCase()))];
};

export interface PublicAccreditation {
  scope: "course" | "academy";
  scheme: string;
  body_name: string | null;
  reference_number: string | null;
  nqf_level: number | null;
  valid_from: string | null;
  valid_to: string | null;
}

/**
 * The only way UI may print an accreditation line. Takes rows from academy_public_accreditation() (already
 * verified and in date) and returns null when there are none, so "no data" can never render as a claim.
 */
export const accreditationLine = (rows: readonly PublicAccreditation[] | null | undefined): string | null => {
  const row = rows?.find((r) => r.body_name && r.reference_number);
  if (!row) return null;
  const level = row.nqf_level ? `, NQF level ${row.nqf_level}` : "";
  return `${row.scheme} — ${row.body_name}, ref. ${row.reference_number}${level}`;
};

/** Fallback line for certificates and course pages when nothing is verified. */
export const CERTIFICATE_DISCLAIMER =
  "This is a SkinLabs Academy Certificate of Completion. It is not a regulated qualification and is not accredited by SAQA, the QCTO or any professional body.";
