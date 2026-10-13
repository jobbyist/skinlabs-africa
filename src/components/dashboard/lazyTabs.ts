import { lazyWithRetry } from "@/lib/chunkRecovery";

/**
 * Dashboard sections other than Home load on demand. Home is what almost every visit renders, and the
 * rest (the analysis flow with its PDF + chart libraries, billing, settings…) used to be shipped with
 * it: ~850 kB of script nobody had asked for. Each loader is also exported so a section can be warmed
 * the moment its tab is hovered or focused (see `prefetchDashboardGroup`).
 */
const loaders = {
  formulator: () => import("@/components/dashboard/FormulatorTab"),
  advancedCard: () => import("@/components/dashboard/AdvancedAssessmentCard"),
  routine: () => import("@/components/dashboard/RoutineTrackerTab"),
  journey: () => import("@/components/dashboard/SkinJourneyTab"),
  saved: () => import("@/components/dashboard/SavedContentTab"),
  inbox: () => import("@/components/dashboard/InboxTab"),
  profile: () => import("@/components/dashboard/ProfileTab"),
  billing: () => import("@/components/dashboard/BillingTab"),
  preorders: () => import("@/components/dashboard/PreOrdersCard"),
  email: () => import("@/components/EmailVerificationCard"),
  mfa: () => import("@/components/MFASettingsCard"),
  account: () => import("@/components/dashboard/AccountTab"),
  app: () => import("@/components/pwa/AppSettingsPanel"),
};

export const FormulatorTab = lazyWithRetry(loaders.formulator);
export const AdvancedAssessmentCard = lazyWithRetry(loaders.advancedCard);
export const RoutineTrackerTab = lazyWithRetry(loaders.routine);
export const SkinJourneyTab = lazyWithRetry(loaders.journey);
export const SavedContentTab = lazyWithRetry(loaders.saved);
export const InboxTab = lazyWithRetry(loaders.inbox);
export const ProfileTab = lazyWithRetry(loaders.profile);
export const BillingTab = lazyWithRetry(loaders.billing);
export const PreOrdersCard = lazyWithRetry(loaders.preorders);
export const EmailVerificationCard = lazyWithRetry(loaders.email);
export const MFASettingsCard = lazyWithRetry(loaders.mfa);
export const AccountTab = lazyWithRetry(loaders.account);
export const AppSettingsPanel = lazyWithRetry(loaders.app);

const GROUP_LOADERS: Record<string, (keyof typeof loaders)[]> = {
  skin: ["formulator", "advancedCard", "routine", "journey"],
  saved: ["saved"],
  inbox: ["inbox"],
  settings: ["profile", "billing"],
};

const warmed = new Set<string>();

/** Start loading a group's sections (hover / focus / pointer-down on its tab). Failures are ignored: the real load retries. */
export const prefetchDashboardGroup = (group: string) => {
  for (const key of GROUP_LOADERS[group] ?? []) {
    if (warmed.has(key)) continue;
    warmed.add(key);
    void loaders[key]().catch(() => warmed.delete(key));
  }
};
