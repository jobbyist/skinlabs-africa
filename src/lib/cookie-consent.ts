/**
 * Cookie consent storage — shared between the CookieConsent banner and any
 * future code that needs to check what a visitor has consented to (e.g.
 * gating analytics or ad scripts) before loading them.
 */
const COOKIE_CONSENT_KEY = "skinlabs_cookie_consent_v2";
/** Re-prompt unauthenticated visitors at most once every 30 days. */
export const CONSENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface CookiePreferences {
  analytics: boolean;
  personalisation: boolean;
  targetedAdvertising: boolean;
}

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  analytics: false,
  personalisation: false,
  targetedAdvertising: false,
};

export interface CookieConsentRecord {
  preferences: CookiePreferences;
  timestamp: number;
}

export const readCookieConsent = (): CookieConsentRecord | null => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (typeof parsed.timestamp !== "number" || typeof parsed.preferences !== "object" || !parsed.preferences) {
      return null;
    }
    return { timestamp: parsed.timestamp, preferences: { ...DEFAULT_COOKIE_PREFERENCES, ...parsed.preferences } };
  } catch {
    return null;
  }
};

export const isCookieConsentFresh = (record: CookieConsentRecord | null) => {
  if (!record) return false;
  return Date.now() - record.timestamp < CONSENT_TTL_MS;
};

export const writeCookieConsent = (preferences: CookiePreferences) => {
  const record: CookieConsentRecord = { preferences, timestamp: Date.now() };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
};

/** Read the visitor's saved cookie preferences, if any — for gating analytics/ad scripts elsewhere. */
export const getStoredCookiePreferences = (): CookiePreferences | null => {
  const record = readCookieConsent();
  return record ? record.preferences : null;
};
