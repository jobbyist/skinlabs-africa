import ConversionDialogs from "@/components/ConversionDialogs";
import IntentResolver from "@/components/IntentResolver";
import { Toaster } from "@/components/ui/sonner";

/**
 * What App.tsx provides to gated content, for the TanStack Start SSR routes
 * (reviews.$slug, spotlight.$slug) which render outside App.tsx's tree:
 * the conversion dialogs (with full-page navigation, since these routes only
 * have a MemoryRouter), the pending-intent resolver (so an intent returning
 * from Google/email to this page is consumed here rather than replayed later
 * on another page) and a toast outlet. Mount inside the route's MemoryRouter.
 */
const SsrConversionShell = () => (
  <>
    <IntentResolver />
    <ConversionDialogs fullPageNavigation />
    <Toaster />
  </>
);

export default SsrConversionShell;
