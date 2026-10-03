import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Loader2, WifiOff } from "lucide-react";
import SEO from "@/components/SEO";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { probeReachability } from "@/lib/pwa/network";
import { SPLASH_MAX_MS } from "@/lib/pwa/constants";
import { resolveStartDestination, resolveStartState } from "@/lib/pwa/startRoute";

const LOGO_LIGHT = "/logosvg.png";
const LOGO_DARK = "/logosvgwhite.png";

/**
 * /start — the installed app's entry point (manifest start_url). It also works
 * as an ordinary page in a normal browser tab (noindex, not linked anywhere).
 *
 * It never signs anyone in or creates an account itself: it waits for the
 * existing Supabase session restore (useAuth), then
 *   - signed in  → the member experience (/dashboard, or a validated `?next=`);
 *                  IntentResolver still sends a brand-new account to /welcome,
 *   - signed out → the existing AuthDialog, with "Continue to SkinLabs" below,
 *   - offline    → an offline panel (nothing here needs the network to render).
 * A session refresh that is still in flight after the splash ceiling no longer
 * holds the page: the sign-in is shown and the redirect happens if/when the
 * session arrives.
 */
const Start = () => {
  const { user, loading } = useAuth();
  const { isOffline } = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [timedOut, setTimedOut] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const state = resolveStartState({ authLoading: loading, hasUser: Boolean(user), offline: isOffline, timedOut });
  const logo = resolvedTheme === "dark" ? LOGO_DARK : LOGO_LIGHT;

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), SPLASH_MAX_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state !== "member") return;
    navigate(resolveStartDestination(location.search), { replace: true });
  }, [state, navigate, location.search]);

  // Show the existing sign-in once, automatically; closing it leaves the page's own buttons.
  useEffect(() => {
    if (state !== "signin" || autoOpened) return;
    setAutoOpened(true);
    setAuthOpen(true);
  }, [state, autoOpened]);

  const retry = async () => {
    setRetrying(true);
    await probeReachability();
    setRetrying(false);
  };

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center text-foreground"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <SEO title="SkinLabs®" description="Open SkinLabs®, South Africa’s skincare intelligence platform." canonical="/start" noindex />
      <img src={logo} alt="SkinLabs®" width={804} height={261} style={{ width: 200, height: "auto" }} className="mb-8" />

      {(state === "restoring" || state === "member") && (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
          <p className="text-sm">{state === "member" ? "Opening your dashboard…" : "Restoring your session…"}</p>
        </div>
      )}

      {state === "signin" && (
        <div className="flex max-w-sm flex-col items-center gap-4">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Welcome to SkinLabs®</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to pick up your skin profile, routines and saved content — or create a free account in a minute.
          </p>
          <Button size="lg" className="w-full" onClick={() => setAuthOpen(true)}>
            Sign in or create account
          </Button>
          <Link to="/" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Continue to SkinLabs®
          </Link>
        </div>
      )}

      {state === "offline" && (
        <div role="status" aria-live="polite" className="flex max-w-sm flex-col items-center gap-4">
          <WifiOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">You’re offline</h1>
          <p className="text-sm text-muted-foreground">
            Some SkinLabs® features may be unavailable, but your saved content is still here. We’ll take you in as soon as you’re back online.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={retry} disabled={retrying} aria-busy={retrying}>
              {retrying ? "Checking…" : "Try again"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/podcast">Downloaded episodes</Link>
            </Button>
          </div>
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signin" returnTo="/start" />
    </main>
  );
};

export default Start;
