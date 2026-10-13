/**
 * Member usernames: format rules, sign-in identifier handling and suggestion generation. Pure; unit tested in
 * src/lib/__tests__/username.test.ts. The database is the authority (validate_profile_username trigger +
 * check_usernames RPC); these checks only give instant feedback before the network round trip.
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/** Mirrors username_reserved() in 20261008100000_member_usernames.sql. */
const RESERVED = new Set([
  "admin", "administrator", "root", "support", "help", "info", "contact", "staff", "moderator", "mod",
  "skinlabs", "skinlabsafrica", "skynn", "skynnai", "openhaus", "team", "official", "security", "billing",
  "null", "undefined", "anonymous", "system", "noreply", "reports", "feedback", "consult",
]);

export type UsernameStatus = "available" | "yours" | "taken" | "invalid" | "reserved";

/** Instant, offline check. Returns a message, or null when the format is acceptable. */
export const usernameFormatError = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return "Choose a username.";
  if (value.length < 3) return "Use at least 3 characters.";
  if (value.length > 20) return "Use 20 characters or fewer.";
  if (!USERNAME_PATTERN.test(value)) return "Use only letters, numbers and underscores.";
  if (/^glow_/i.test(value)) return "glow_ usernames are reserved for new accounts.";
  if (RESERVED.has(value.toLowerCase())) return "That username is reserved.";
  return null;
};

export const statusMessage = (status: UsernameStatus, value: string): string => {
  switch (status) {
    case "available":
      return `${value} is available.`;
    case "yours":
      return "This is your current username.";
    case "taken":
      return `${value} is already taken.`;
    case "reserved":
      return "That username is reserved.";
    default:
      return usernameFormatError(value) ?? "That username isn't valid.";
  }
};

/** A sign-in field holding an email is signed in directly; anything else is looked up as a username. */
export const isEmailIdentifier = (identifier: string): boolean => identifier.includes("@");

const slug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export interface SuggestionSeeds {
  fullName?: string | null;
  email?: string | null;
  /** The text currently in the field, if any. */
  typed?: string | null;
}

/**
 * Ideas to try, in priority order, deduplicated and format-valid. `random` and `year` are injectable so tests are
 * deterministic. Availability is NOT known here: the caller filters through check_usernames().
 */
export const generateSuggestions = (
  seeds: SuggestionSeeds,
  { count = 8, random = Math.random }: { count?: number; random?: () => number } = {},
): string[] => {
  const nameParts = (seeds.fullName ?? "").trim().split(/\s+/).map(slug).filter(Boolean);
  const emailBase = slug((seeds.email ?? "").split("@")[0] ?? "");
  const typed = slug(seeds.typed ?? "");
  const first = nameParts[0] ?? "";
  const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const bases = [typed, first && last ? `${first}${last}` : "", first && last ? `${first}_${last}` : "", first, emailBase]
    .filter((b) => b.length >= 2);
  const adjectives = ["glow", "dewy", "radiant", "silky", "luminous"];
  const nouns = ["skin", "glow", "dew", "ritual"];
  const out: string[] = [];
  const push = (candidate: string) => {
    const c = candidate.slice(0, 20);
    if (!usernameFormatError(c) && !out.some((o) => o.toLowerCase() === c.toLowerCase())) out.push(c);
  };
  const digits = () => String(Math.floor(random() * 90) + 10);
  for (const base of bases) {
    push(base);
    push(`${base}${digits()}`);
    push(`${base}_skin`);
  }
  while (out.length < count) {
    const a = adjectives[Math.floor(random() * adjectives.length)];
    const n = nouns[Math.floor(random() * nouns.length)];
    push(`${a}${n}${digits()}`);
    if (out.length > 200) break;
  }
  return out.slice(0, count);
};
