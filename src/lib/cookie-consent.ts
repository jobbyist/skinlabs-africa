/**
 * Cookie consent storage & validation for SkinLabs.
 * 90-day validity; localStorage for anonymous; profiles for authenticated.
 */
export const COOKIE_CONSENT_KEY = "skinlabs_cookie_consent_v1";
const LEGACY_COOKIE_CONSENT_KEY = "skinlabs_cookie_consent_v2";
export const COOKIE_CONSENT_VERSION = "v1";
export const CONSENT_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

export type ConsentDecision = "accepted" | "rejected";

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
  decision: ConsentDecision;
  timestamp: string;
  expiresAt: string;
  version: string;
  preferences: CookiePreferences;
}

function safeGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function isValidPreferences(p: unknown): p is CookiePreferences {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as CookiePreferences).analytics === "boolean" &&
    typeof (p as CookiePreferences).personalisation === "boolean" &&
    typeof (p as CookiePreferences).targetedAdvertising === "boolean"
  );
}

function deriveDecision(preferences: CookiePreferences): ConsentDecision {
  return preferences.analytics || preferences.personalisation || preferences.targetedAdvertising
    ? "accepted"
    : "rejected";
}

export function buildConsentRecord(preferences: CookiePreferences): CookieConsentRecord {
  const now = Date.now();
  return {
    decision: deriveDecision(preferences),
    timestamp: new Date(now).toISOString(),
    expiresAt: new Date(now + CONSENT_DURATION_MS).toISOString(),
    version: COOKIE_CONSENT_VERSION,
    preferences: { ...DEFAULT_COOKIE_PREFERENCES, ...preferences },
  };
}

export function isConsentValid(record: CookieConsentRecord | null | undefined): boolean {
  if (!record) return false;
  if (record.version !== COOKIE_CONSENT_VERSION) return false;
  if (!record.expiresAt || !record.timestamp) return false;
  const expires = Date.parse(record.expiresAt);
  if (Number.isNaN(expires)) return false;
  return Date.now() < expires;
}

function migrateLegacy(raw: string): CookieConsentRecord | null {
  try {
    const parsed = JSON.parse(raw) as { preferences?: CookiePreferences; timestamp?: number };
    if (typeof parsed.timestamp !== "number" || !isValidPreferences(parsed.preferences)) return null;
    const preferences = { ...DEFAULT_COOKIE_PREFERENCES, ...parsed.preferences };
    return {
      decision: deriveDecision(preferences),
      timestamp: new Date(parsed.timestamp).toISOString(),
      expiresAt: new Date(parsed.timestamp + CONSENT_DURATION_MS).toISOString(),
      version: COOKIE_CONSENT_VERSION,
      preferences,
    };
  } catch {
    return null;
  }
}

function parseRecord(raw: string | null): CookieConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord> & { preferences?: CookiePreferences; timestamp?: number | string };
    if (
      typeof parsed.timestamp === "string" &&
      typeof parsed.expiresAt === "string" &&
      (parsed.decision === "accepted" || parsed.decision === "rejected") &&
      typeof parsed.version === "string"
    ) {
      return {
        decision: parsed.decision,
        timestamp: parsed.timestamp,
        expiresAt: parsed.expiresAt,
        version: parsed.version,
        preferences: isValidPreferences(parsed.preferences)
          ? { ...DEFAULT_COOKIE_PREFERENCES, ...parsed.preferences }
          : DEFAULT_COOKIE_PREFERENCES,
      };
    }
    return migrateLegacy(raw);
  } catch {
    return null;
  }
}

export const readCookieConsent = (): CookieConsentRecord | null => {
  const current = parseRecord(safeGet(COOKIE_CONSENT_KEY));
  if (current) return current;
  const legacyRaw = safeGet(LEGACY_COOKIE_CONSENT_KEY);
  if (legacyRaw) {
    const migrated = migrateLegacy(legacyRaw);
    if (migrated) {
      writeCookieConsentRecord(migrated);
      safeRemove(LEGACY_COOKIE_CONSENT_KEY);
      return migrated;
    }
  }
  return null;
};

export const isCookieConsentFresh = (record: CookieConsentRecord | null = readCookieConsent()) =>
  isConsentValid(record);

export const writeCookieConsentRecord = (record: CookieConsentRecord): void => {
  safeSet(COOKIE_CONSENT_KEY, JSON.stringify(record));
};

export const writeCookieConsent = (preferences: CookiePreferences): CookieConsentRecord => {
  const record = buildConsentRecord(preferences);
  writeCookieConsentRecord(record);
  return record;
};

export const getStoredCookiePreferences = (): CookiePreferences | null => {
  const record = readCookieConsent();
  if (!isConsentValid(record)) return null;
  return record!.preferences;
};

export const clearCookieConsent = (): void => {
  safeRemove(COOKIE_CONSENT_KEY);
  safeRemove(LEGACY_COOKIE_CONSENT_KEY);
};

export function recordFromProfile(profile: {
  cookie_consent?: string | null;
  cookie_consent_at?: string | null;
  cookie_consent_expires_at?: string | null;
  cookie_consent_version?: string | null;
  cookie_preferences?: CookiePreferences | null;
}): CookieConsentRecord | null {
  if (!profile.cookie_consent || !profile.cookie_consent_at || !profile.cookie_consent_expires_at) return null;
  const decision =
    profile.cookie_consent === "accepted" || profile.cookie_consent === "rejected"
      ? profile.cookie_consent
      : null;
  if (!decision) return null;
  const preferences = isValidPreferences(profile.cookie_preferences)
    ? { ...DEFAULT_COOKIE_PREFERENCES, ...profile.cookie_preferences }
    : decision === "accepted"
      ? { analytics: true, personalisation: true, targetedAdvertising: true }
      : DEFAULT_COOKIE_PREFERENCES;
  return {
    decision,
    timestamp: profile.cookie_consent_at,
    expiresAt: profile.cookie_consent_expires_at,
    version: profile.cookie_consent_version || COOKIE_CONSENT_VERSION,
    preferences,
  };
}

export function profilePayloadFromRecord(record: CookieConsentRecord) {
  return {
    cookie_consent: record.decision,
    cookie_consent_at: record.timestamp,
    cookie_consent_expires_at: record.expiresAt,
    cookie_consent_version: record.version,
    cookie_preferences: record.preferences,
  };
}
