/**
 * SkinLabs® October 2026 Skin Story Giveaway — the single source of truth for campaign facts.
 *
 * Everything the landing page, T&Cs, story, analytics and entry RPC say about the giveaway comes from here, so a
 * change of date or prize is one edit. Facts the business has NOT supplied are `null` and listed in
 * `GIVEAWAY_OPEN_QUESTIONS`; nothing legal is invented to fill them (see terms.ts for how copy degrades).
 * The closing instant must stay in sync with `giveaway_closes_at()` in
 * supabase/migrations/20261006100000_giveaway_entries.sql (a unit test reads the migration).
 */

export const GIVEAWAY_SLUG = "october-2026";
export const GIVEAWAY_PATH = "/giveaways/october-2026";
/** Analytics campaign label (first-party analytics + TikTok content id). Lowercase token. */
export const GIVEAWAY_CAMPAIGN = "skinlabs_october_2026_giveaway";
/** Slug of the curated web story (src/lib/webStories/curated.ts) and of its /web-stories/:slug AMP page. */
export const GIVEAWAY_STORY_SLUG = "skin-story-giveaway-october-2026";
/** Version stamped on each entry, bump when the T&Cs change materially. */
export const GIVEAWAY_TERMS_VERSION = "2026-10-04";
export const GIVEAWAY_NAME = "SkinLabs® October 2026 Skin Story Giveaway";
export const GIVEAWAY_TIKTOK_HANDLE = "@skinlabsza";
export const GIVEAWAY_TIKTOK_URL = "https://www.tiktok.com/@skinlabsza";

/** Calendar closing date shown to people, and the instant entries stop (end of that day, SAST = UTC+2). */
export const GIVEAWAY_DEADLINE_DATE = "2026-10-15";
export const GIVEAWAY_DEADLINE_LABEL = "15 October 2026";
export const GIVEAWAY_CLOSES_AT = "2026-10-15T23:59:59+02:00";
export const GIVEAWAY_CLOSING_TIME_LABEL = "23:59 South African Standard Time (SAST)";

/** The free assessment the giveaway sends people to (existing canonical route — never a new one). */
export const GIVEAWAY_ASSESSMENT_PATH = "/skynn-ai";

/** Campaign CTA copy; keep the assessment label clear and non-clinical. */
export const GIVEAWAY_COPY = {
  primaryCta: "Start your free skin assessment",
  enterCta: "Enter the giveaway",
  storyCta: "Share Your Skin Story",
  storyAssessmentCta: "Start your free skin assessment",
} as const;

export const GIVEAWAY_PRIZES = {
  winners: 2,
  voucher: "R500 Takealot voucher",
  subscription: "Lifetime Glow Insider",
} as const;

/** Copy the video itself carries ("announced on our website and TikTok") — used in the T&Cs. */
export const GIVEAWAY_WINNER_ANNOUNCEMENT = "on the SkinLabs® website and on TikTok";

/** Support address that already exists elsewhere in the product (support@ is used by the email system). */
export const GIVEAWAY_CONTACT_EMAIL = "support@skinlabs.co.za";

export interface GiveawayLegalConfig {
  /** TODO(legal): registered legal entity name of the promoter. Not in the repository. */
  promoterLegalName: string | null;
  /** TODO(legal): registration number + physical address of the promoter. */
  promoterRegistration: string | null;
  /** Minimum entrant age. Supplied by the owner 2026-10-04: 18. */
  minimumAge: number | null;
  /** Geographic eligibility wording. Supplied by the owner 2026-10-04. */
  territory: string | null;
  /** TODO(business): how winners are drawn (random draw vs judged). Not supplied. */
  winnerSelectionMethod: string | null;
  /** Date winners are announced. Supplied by the owner 2026-10-04: the day after entries close. */
  winnerAnnouncementDate: string | null;
  /** Date prizes are awarded. Supplied by the owner 2026-10-04. */
  prizeAwardDate: string | null;
  /** When Lifetime Glow Insider starts. Supplied by the owner 2026-10-04: after the extended free trial period. */
  lifetimeActivation: string | null;
  /** TODO(business): days a winner has to respond before a replacement is chosen. */
  prizeClaimWindowDays: number | null;
  /** TODO(business): may SkinLabs® repost entrants' Stories? Default copy promises it will NOT without asking. */
  ugcRepostLicence: boolean | null;
  /** TODO(legal): what "lifetime" means (lifetime of the account? of the Glow Insider plan?). Not defined anywhere. */
  lifetimeDefinition: string | null;
  /** TODO(business): who fulfils the Takealot voucher, and its expiry. */
  voucherExpiryNote: string | null;
  /** Have the 15 Oct 23:59 SAST closing time and these terms been signed off by the business/legal? */
  signedOff: boolean;
}

export const GIVEAWAY_LEGAL: GiveawayLegalConfig = {
  promoterLegalName: null,
  promoterRegistration: null,
  minimumAge: 18,
  territory: "legal residents or citizens of the Republic of South Africa",
  winnerSelectionMethod: null,
  winnerAnnouncementDate: "16 October 2026",
  prizeAwardDate: "31 October 2026",
  lifetimeActivation: "on the winner's account after the current extended free trial period ends on 1 November 2026",
  prizeClaimWindowDays: null,
  ugcRepostLicence: null,
  lifetimeDefinition: null,
  voucherExpiryNote: null,
  signedOff: false,
};

/** Human-readable list of facts still needing business/legal confirmation (drives the report and a test). */
export const giveawayOpenQuestions = (legal: GiveawayLegalConfig = GIVEAWAY_LEGAL): string[] => {
  const q: string[] = [];
  if (!legal.promoterLegalName) q.push("Promoter's registered legal entity name");
  if (!legal.promoterRegistration) q.push("Promoter's registration number and physical address");
  if (legal.minimumAge === null) q.push("Minimum entrant age");
  if (!legal.territory) q.push("Geographic eligibility (e.g. South Africa only?)");
  if (!legal.prizeAwardDate) q.push("Date prizes are awarded");
  if (!legal.lifetimeActivation) q.push("When Lifetime Glow Insider starts for the winners");
  if (!legal.winnerSelectionMethod) q.push("How the two winners are selected (random draw or judged)");
  if (!legal.winnerAnnouncementDate) q.push("Date winners will be announced");
  if (legal.prizeClaimWindowDays === null) q.push("How long a winner has to respond before a replacement is drawn");
  if (legal.ugcRepostLicence === null) q.push("Whether SkinLabs® may repost entrants' TikTok Stories (copy currently promises it will not without asking)");
  if (!legal.lifetimeDefinition) q.push("Definition of \"lifetime\" for Glow Insider (account lifetime vs plan lifetime) and how SkinLabs® grants it to the winners");
  if (!legal.voucherExpiryNote) q.push("Takealot voucher expiry / delivery method");
  if (!legal.signedOff) q.push("Legal sign-off of these terms and of the assumed 23:59 SAST closing time on 15 October");
  return q;
};

const closesAtMs = Date.parse(GIVEAWAY_CLOSES_AT);

export const isGiveawayOpen = (now: Date | number = Date.now()): boolean =>
  (typeof now === "number" ? now : now.getTime()) <= closesAtMs;

/** Whole SAST calendar days left (0 on the closing day, null once closed). */
export const daysLeft = (now: Date | number = Date.now()): number | null => {
  const t = typeof now === "number" ? now : now.getTime();
  if (t > closesAtMs) return null;
  const SAST = 2 * 3600_000;
  const day = (ms: number) => Math.floor((ms + SAST) / 86_400_000);
  return day(closesAtMs) - day(t);
};

/** TikTok handle as people type it: optional @, 2–24 chars of letters, digits, `_` and `.`. Returns without the @. */
export const normaliseTikTokHandle = (raw: string): string | null => {
  const v = raw.trim().replace(/^@+/, "");
  return /^[A-Za-z0-9_.]{2,24}$/.test(v) && !v.endsWith(".") ? v : null;
};

/** Campaign SEO (title is the approved one; the brand is already in it so SEO.tsx won't append it again). */
export const GIVEAWAY_SEO = {
  title: "Win R500 + Lifetime Glow Insider | SkinLabs® October Giveaway",
  description:
    "Take the free AI skin assessment, share your Skin Story on TikTok, tag @skinlabsza and win a R500 Takealot voucher + Lifetime Glow Insider. Closes 15 Oct 2026.",
  ogImage: "/og-giveaway-october-2026.jpg",
} as const;

