import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TIER_LABELS } from "@/lib/entitlements";
import { consumePendingIntent, type PendingIntent } from "@/lib/pendingIntent";
import { WELCOME_PATH, isNewAccount, shouldRedirectNewAccount, trialDestination } from "@/lib/intentRouting";
import { useStartTrial } from "@/hooks/use-start-trial";
import { openMembershipCheckout } from "@/lib/conversionDialogs";

/** Once per browser session per account, so a reload never re-routes a new member. */
const ROUTED_KEY_PREFIX = "skinlabs_intent_routed:";

const alreadyRouted = (userId: string) => {
  try {
    return sessionStorage.getItem(`${ROUTED_KEY_PREFIX}${userId}`) === "1";
  } catch {
    return false;
  }
};

const markRouted = (userId: string) => {
  try {
    sessionStorage.setItem(`${ROUTED_KEY_PREFIX}${userId}`, "1");
  } catch {
    /* noop */
  }
};

const planLabel = (plan: string) => TIER_LABELS[plan as keyof typeof TIER_LABELS] ?? plan;

/**
 * Resumes whatever a visitor was doing when they hit the sign-in wall
 * (src/lib/pendingIntent.ts). Mounted once in App.tsx, inside the router.
 *
 * Fires when the signed-in user id changes from none to set — an in-page
 * sign-in/sign-up, or arriving back from Google OAuth or an email
 * confirmation link. The intent is read AND cleared before it runs, so it
 * can only ever run once. With no intent, a brand-new account is sent to
 * the welcome flow (WELCOME_PATH).
 */
const IntentResolver = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastUserId = useRef<string | null>(null);
  const { start: startTrial } = useStartTrial();

  const here = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (loading) return;
    const userId = user?.id ?? null;
    const previous = lastUserId.current;
    lastUserId.current = userId;
    if (!userId || userId === previous) return;

    const go = (to: string) => {
      if (to !== here) navigate(to);
    };

    const run = async (intent: PendingIntent) => {
      switch (intent.action) {
        case "trial": {
          if (intent.plan !== "insider" && intent.plan !== "glow_lite") {
            go(intent.returnTo);
            return;
          }
          // Same one-tap path as Pricing/Hero (errors, events, membership
          // refresh). A trial started from content lands back on it,
          // unlocked; one from /pricing or home goes to the welcome flow.
          const started = await startTrial({ plan: intent.plan, source: "intent_resume", destination: null });
          go(started ? trialDestination(intent.returnTo) : intent.returnTo);
          return;
        }
        case "subscribe": {
          if (!intent.plan) return;
          go(intent.returnTo);
          // Rendered by <ConversionDialogs /> (mounted next to this in App.tsx).
          openMembershipCheckout({
            plan: { planId: intent.plan, name: planLabel(intent.plan), interval: intent.interval ?? "monthly" },
            variantKey: intent.variantKey ?? "control",
          });
          return;
        }
        case "save_analysis":
        case "unlock":
          go(intent.returnTo);
          return;
      }
    };

    const intent = consumePendingIntent();
    if (intent) {
      markRouted(userId);
      void run(intent);
      return;
    }

    if (alreadyRouted(userId) || !shouldRedirectNewAccount(location.pathname)) return;
    const createdAt = user?.created_at;
    void (async () => {
      const { data } = await supabase.from("profiles").select("onboarding_completed_at").eq("user_id", userId).maybeSingle();
      markRouted(userId);
      if (isNewAccount(createdAt, data?.onboarding_completed_at ?? null)) go(WELCOME_PATH);
    })();
    // Runs on auth transitions only; `here`/`location` are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  return null;
};

export default IntentResolver;
