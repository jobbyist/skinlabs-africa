import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  clearCookieConsent,
  DEFAULT_COOKIE_PREFERENCES,
  isConsentValid,
  profilePayloadFromRecord,
  readCookieConsent,
  recordFromProfile,
  writeCookieConsent,
  writeCookieConsentRecord,
  type CookieConsentRecord,
  type CookiePreferences,
} from "@/lib/cookie-consent";
import { isEntryGateResolved, onEntryGateResolved } from "@/lib/entry-gate";

export type CookieConsentStatus = "initializing" | "ready";

export interface UseCookieConsentResult {
  status: CookieConsentStatus;
  decision: CookieConsentRecord["decision"] | null;
  preferences: CookiePreferences;
  hasValidConsent: boolean;
  shouldShowBanner: boolean;
  acceptConsent: (preferences?: CookiePreferences) => Promise<void>;
  rejectConsent: () => Promise<void>;
  savePreferences: (preferences: CookiePreferences) => Promise<void>;
  resetConsent: () => void;
  openPreferences: () => void;
  closeBanner: () => void;
}

const SHOW_AFTER_MS = 1_200;

/**
 * Centralised cookie-consent state manager.
 * Precedence: valid Supabase profile (when signed in) → valid localStorage → show banner once.
 */
export function useCookieConsent(): UseCookieConsentResult {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<CookieConsentStatus>("initializing");
  const [record, setRecord] = useState<CookieConsentRecord | null>(null);
  const [forceShow, setForceShow] = useState(false);
  const [bannerEligible, setBannerEligible] = useState(false);
  const initOnce = useRef(false);
  const syncInFlight = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (initOnce.current) return;
    initOnce.current = true;

    let cancelled = false;

    const finish = (rec: CookieConsentRecord | null) => {
      if (cancelled) return;
      setRecord(rec);
      setStatus("ready");
      if (!isConsentValid(rec)) {
        const arm = () => {
          window.setTimeout(() => {
            if (!cancelled) setBannerEligible(true);
          }, SHOW_AFTER_MS);
        };
        if (isEntryGateResolved()) {
          arm();
        } else {
          onEntryGateResolved(arm);
        }
      }
    };

    const bootstrap = async () => {
      const local = readCookieConsent();
      if (isConsentValid(local)) finish(local);

      if (!user) {
        if (!isConsentValid(local)) finish(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "cookie_consent, cookie_consent_at, cookie_consent_expires_at, cookie_consent_version, cookie_preferences",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data) {
          const remote = recordFromProfile(data as Parameters<typeof recordFromProfile>[0]);
          if (isConsentValid(remote)) {
            writeCookieConsentRecord(remote!);
            finish(remote);
            return;
          }
        }

        if (isConsentValid(local)) {
          if (!syncInFlight.current) {
            syncInFlight.current = true;
            try {
              await supabase
                .from("profiles")
                .update(profilePayloadFromRecord(local!))
                .eq("user_id", user.id);
            } catch {
              /* non-blocking */
            } finally {
              syncInFlight.current = false;
            }
          }
          finish(local);
          return;
        }

        finish(null);
      } catch {
        finish(isConsentValid(local) ? local : null);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || status !== "ready") return;
    if (user) return;
    const local = readCookieConsent();
    if (isConsentValid(local)) {
      setRecord(local);
      setBannerEligible(false);
    }
  }, [user, authLoading, status]);

  const persist = useCallback(
    async (preferences: CookiePreferences) => {
      const next = writeCookieConsent(preferences);
      setRecord(next);
      setForceShow(false);
      setBannerEligible(false);

      if (user) {
        try {
          await supabase
            .from("profiles")
            .update(profilePayloadFromRecord(next))
            .eq("user_id", user.id);
        } catch {
          /* local already saved */
        }
      }
    },
    [user],
  );

  const acceptConsent = useCallback(
    async (preferences?: CookiePreferences) => {
      await persist(
        preferences ?? {
          analytics: true,
          personalisation: true,
          targetedAdvertising: true,
        },
      );
    },
    [persist],
  );

  const rejectConsent = useCallback(async () => {
    await persist(DEFAULT_COOKIE_PREFERENCES);
  }, [persist]);

  const savePreferences = useCallback(
    async (preferences: CookiePreferences) => {
      await persist(preferences);
    },
    [persist],
  );

  const resetConsent = useCallback(() => {
    clearCookieConsent();
    setRecord(null);
    setForceShow(true);
    setBannerEligible(true);
  }, []);

  const openPreferences = useCallback(() => setForceShow(true), []);
  const closeBanner = useCallback(() => setForceShow(false), []);

  const hasValidConsent = isConsentValid(record);
  const shouldShowBanner =
    status === "ready" && (forceShow || (!hasValidConsent && bannerEligible));

  return {
    status,
    decision: record?.decision ?? null,
    preferences: record?.preferences ?? DEFAULT_COOKIE_PREFERENCES,
    hasValidConsent,
    shouldShowBanner,
    acceptConsent,
    rejectConsent,
    savePreferences,
    resetConsent,
    openPreferences,
    closeBanner,
  };
}
