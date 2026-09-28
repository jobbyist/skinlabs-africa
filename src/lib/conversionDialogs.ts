import type { MembershipCheckoutPlan } from "@/components/payments/MembershipCheckoutDialog";
import type { KeepMembershipOptions } from "@/components/payments/KeepMembershipDialog";

/**
 * Tiny event bus between conversion CTAs (useConversionAction) and the one
 * <ConversionDialogs /> host that renders AuthDialog and the membership
 * checkout. Gates can live anywhere — including the TanStack Start SSR routes,
 * which don't share App.tsx's tree — without each mounting its own dialogs.
 * The SPA mounts the host in App.tsx; each SSR route that renders a gate
 * mounts it too.
 */
const OPEN_SIGNUP_EVENT = "skinlabs:open-signup";
const OPEN_CHECKOUT_EVENT = "skinlabs:open-membership-checkout";
const OPEN_KEEP_EVENT = "skinlabs:open-keep-membership";

export interface OpenCheckoutDetail {
  plan: MembershipCheckoutPlan;
  variantKey?: string;
}

export const openSignupDialog = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_SIGNUP_EVENT));
};

export const openMembershipCheckout = (detail: OpenCheckoutDetail) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<OpenCheckoutDetail>(OPEN_CHECKOUT_EVENT, { detail }));
};

// Subscribers are only called from effects, but stay no-ops without a window
// for symmetry with the dispatchers above.
export const onOpenSignupDialog = (handler: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_SIGNUP_EVENT, handler);
  return () => window.removeEventListener(OPEN_SIGNUP_EVENT, handler);
};

export const onOpenMembershipCheckout = (handler: (detail: OpenCheckoutDetail) => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<OpenCheckoutDetail>).detail);
  window.addEventListener(OPEN_CHECKOUT_EVENT, listener);
  return () => window.removeEventListener(OPEN_CHECKOUT_EVENT, listener);
};

/** "Keep my membership" (KeepMembershipDialog): trial banner, checklist, ?keep=1 links, Billing. */
export const openKeepMembership = (detail: KeepMembershipOptions = {}) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<KeepMembershipOptions>(OPEN_KEEP_EVENT, { detail }));
};

export const onOpenKeepMembership = (handler: (detail: KeepMembershipOptions) => void) => {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<KeepMembershipOptions>).detail ?? {});
  window.addEventListener(OPEN_KEEP_EVENT, listener);
  return () => window.removeEventListener(OPEN_KEEP_EVENT, listener);
};
