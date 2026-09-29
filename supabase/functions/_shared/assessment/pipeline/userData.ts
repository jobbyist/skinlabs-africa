/**
 * Prompt-injection and PII boundary for SKYNN AI v2 (framework §5, §10, §11).
 *
 * Every piece of user-derived content reaches a model ONLY inside
 * <user_data-{SALT}> ... </user_data-{SALT}> tags, where SALT is random per
 * session and never shown to the user. A respondent can't close the tag
 * early without guessing the salt, and any literal "user_data" tag text in
 * their answers is neutralised first as defence in depth. The prompts
 * themselves tell the model to treat tagged content as data, never as
 * instructions.
 *
 * Free text is also scrubbed of obvious direct identifiers (emails, phone
 * numbers, 13-digit SA ID numbers, URLs) before it leaves SkinLabs: POPIA
 * data minimisation (s10) plus the framework's "no unnecessary PII echoed
 * back". Deterministic and Deno/Bun-portable.
 */

const SALT_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += SALT_ALPHABET[b % SALT_ALPHABET.length];
  return out;
}

/** Replaces the `{{SALT}}` placeholder the registry prompts are stored with. */
export function applySalt(systemPrompt: string, salt: string): string {
  return systemPrompt.split("{{SALT}}").join(salt);
}

const TAG_LIKE = /<\s*\/?\s*user_data[^>]*>/gi;

export function neutraliseTags(text: string): string {
  return text.replace(TAG_LIKE, "[removed tag]");
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL = /\bhttps?:\/\/\S+/gi;
const SA_ID = /\b\d{13}\b/g;
// +27 / 0-prefixed SA numbers and other long digit runs with separators.
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

export function scrubPii(text: string): string {
  return text
    .replace(EMAIL, "[email removed]")
    .replace(URL, "[link removed]")
    .replace(SA_ID, "[id number removed]")
    // Only treat a digit run as a phone number when it has 9+ digits, so
    // dates ("2026-09-23") and concentrations ("0.5-1%") survive.
    .replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 9 ? "[number removed]" : m));
}

/** Deep-cleans every string in a JSON-like value. Keys are left as-is
 *  (they come from SkinLabs' own question library, not the user). */
export function sanitiseValue(value: unknown): unknown {
  if (typeof value === "string") return neutraliseTags(scrubPii(value)).slice(0, 2000);
  if (Array.isArray(value)) return value.map(sanitiseValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = sanitiseValue(v);
    return out;
  }
  return value;
}

export function wrapUserData(salt: string, label: string, payload: unknown): string {
  const body = JSON.stringify(sanitiseValue(payload), null, 2);
  return `<user_data-${salt} label="${label}">\n${body}\n</user_data-${salt}>`;
}
