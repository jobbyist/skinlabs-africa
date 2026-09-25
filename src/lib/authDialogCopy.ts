import { TIER_LABELS } from "@/lib/entitlements";
import type { PendingIntent } from "@/lib/pendingIntent";

/**
 * Title/description for AuthDialog, driven by what the visitor was doing when
 * they hit the sign-in wall (src/lib/pendingIntent.ts). Pure, unit tested in
 * src/lib/__tests__/authDialogCopy.test.ts.
 */

export type AuthTab = "signin" | "signup";

export interface AuthDialogCopy {
  title: string;
  description: string;
}

const DEFAULT_DESCRIPTION =
  "Save reviews, unlock full podcast episodes and build your AI routine — grounded in SA skin and climate.";

const planLabel = (plan?: string) =>
  (plan && TIER_LABELS[plan as keyof typeof TIER_LABELS]) || TIER_LABELS.insider;

const intentCopy = (intent: PendingIntent): AuthDialogCopy | null => {
  switch (intent.action) {
    case "trial":
      return {
        title: `Create your account to start ${planLabel(intent.plan)} free`,
        description: "No card required. Your free trial starts as soon as you're in.",
      };
    case "save_analysis":
      return {
        title: "Save your SKYNN AI results",
        description: "Create a free account and your results are saved to it, so you can come back to them any time.",
      };
    case "unlock":
      return {
        title: "Create a free account to keep reading",
        description: "Free, no card needed. You'll come straight back to this page.",
      };
    case "subscribe":
      return {
        title: `Create your account to join ${planLabel(intent.plan)}`,
        description: "Then you'll go straight to checkout.",
      };
    default:
      return null;
  }
};

/**
 * The intent's copy on the sign-up tab. On the log-in tab the title stays
 * "Log in to SkinLabs®" (someone logging in isn't creating an account), but
 * the intent's description still explains why they're being asked.
 */
export const authDialogCopy = (intent: PendingIntent | null, tab: AuthTab): AuthDialogCopy => {
  const fromIntent = intent ? intentCopy(intent) : null;
  if (tab === "signin") {
    return { title: "Log in to SkinLabs®", description: fromIntent?.description ?? DEFAULT_DESCRIPTION };
  }
  return fromIntent ?? { title: "Create your account", description: DEFAULT_DESCRIPTION };
};

/**
 * Which tab AuthDialog opens on: an explicit `mode`/`defaultTab` from the
 * caller wins (e.g. "Already have an account? Sign in"); otherwise a pending
 * intent means the visitor was sent here to create an account.
 */
export const initialAuthTab = (
  mode: AuthTab | undefined,
  defaultTab: AuthTab | undefined,
  intent: PendingIntent | null,
): AuthTab => mode ?? defaultTab ?? (intent ? "signup" : "signin");
