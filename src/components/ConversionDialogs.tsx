import { Suspense, useEffect, useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import { onOpenKeepMembership, onOpenMembershipCheckout, onOpenSignupDialog, type OpenCheckoutDetail } from "@/lib/conversionDialogs";
import type { KeepMembershipOptions } from "@/components/payments/KeepMembershipDialog";

// Checkout pulls in the PayPal button code — only load it when someone subscribes.
const MembershipCheckoutDialog = lazyWithRetry(() => import("@/components/payments/MembershipCheckoutDialog"));
const KeepMembershipDialog = lazyWithRetry(() => import("@/components/payments/KeepMembershipDialog"));

interface ConversionDialogsProps {
  /** SSR routes only have a MemoryRouter: post-checkout navigation must be a real page load there. */
  fullPageNavigation?: boolean;
}

/**
 * Hosts the dialogs conversion CTAs open (src/lib/conversionDialogs.ts):
 * AuthDialog in sign-up mode, the membership checkout and "Keep my membership". Mount exactly once
 * per React tree — App.tsx for the SPA, and each TanStack Start SSR route that
 * renders a gate.
 */
const ConversionDialogs = ({ fullPageNavigation = false }: ConversionDialogsProps) => {
  const [signupOpen, setSignupOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [checkout, setCheckout] = useState<OpenCheckoutDetail | null>(null);
  const [keep, setKeep] = useState<KeepMembershipOptions | null>(null);

  useEffect(
    () =>
      onOpenSignupDialog((mode) => {
        // Opens on sign-up by default; the visitor can still switch tabs.
        setAuthMode(mode);
        setSignupOpen(true);
      }),
    [],
  );
  useEffect(() => onOpenMembershipCheckout((detail) => setCheckout(detail)), []);
  useEffect(() => onOpenKeepMembership((detail) => setKeep(detail)), []);

  return (
    <>
      <AuthDialog open={signupOpen} onOpenChange={setSignupOpen} mode={authMode} onModeChange={setAuthMode} />
      {checkout && (
        <Suspense fallback={null}>
          <MembershipCheckoutDialog
            open
            onOpenChange={(open) => !open && setCheckout(null)}
            plan={checkout.plan}
            variantKey={checkout.variantKey}
            onNavigate={fullPageNavigation ? (to) => window.location.assign(to) : undefined}
          />
        </Suspense>
      )}
      {keep && (
        <Suspense fallback={null}>
          <KeepMembershipDialog
            open
            onOpenChange={(open) => !open && setKeep(null)}
            {...keep}
            onNavigate={fullPageNavigation ? (to) => window.location.assign(to) : undefined}
          />
        </Suspense>
      )}
    </>
  );
};

export default ConversionDialogs;
