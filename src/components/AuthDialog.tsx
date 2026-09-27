import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, Eye, EyeOff, ArrowLeft, Gift, CreditCard } from "lucide-react";
import skinlabsLogoBlack from "@/assets/skinlabs-logo-black.svg";
import skinlabsLogoWhite from "@/assets/skinlabs-logo-white.svg";
import { trackConversionEvent } from "@/lib/analytics-events";
import { AUTH_FLAGS } from "@/lib/auth-flags";
import { getPendingIntent, isSafeReturnTo, withPendingIntentParams, type PendingIntent } from "@/lib/pendingIntent";
import { getPlan } from "@/data/plans";
import { cn } from "@/lib/utils";
import { trialNoun } from "@/lib/promo";
import { authDialogCopy, initialAuthTab } from "@/lib/authDialogCopy";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Tab to open on. Omit it to let a pending intent decide: someone sent here
   * from a gate or a "Create account" CTA lands on sign-up, anyone else on
   * log in (see initialAuthTab()).
   */
  defaultTab?: "signin" | "signup";
  /** Controlled tab, for callers (e.g. Header) that need to force a specific tab open. */
  mode?: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
  onAuthenticated?: () => void;
  /**
   * Same-origin path (with query) to come back to after an OAuth redirect or an
   * email-confirmation click. Defaults to the current pathname.
   */
  returnTo?: string;
}

type View = "signin" | "signup" | "forgot" | "forgot-sent";

/** Google's standard four-colour "G" mark. */
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" {...props}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6c-2 1.5-4.6 2.4-7.7 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.6 5.6C39.9 36.9 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
  </svg>
);

/** Plan/trial context banner — reflects a pending selection made on /pricing so the visitor never wonders why they're being asked to authenticate. */
const PlanContextBanner = ({ intent }: { intent: PendingIntent }) => {
  if (intent.action !== "trial" && intent.action !== "subscribe") return null;
  const plan = intent.plan ? getPlan(intent.plan) : undefined;
  if (!plan) return null;
  const isTrial = intent.action === "trial" && plan.trialEligible && plan.trialDays;
  return (
    <div className="relative mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        {isTrial ? <Gift className="h-4.5 w-4.5 text-primary" /> : <CreditCard className="h-4.5 w-4.5 text-primary" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {plan.name} {isTrial ? `· ${trialNoun(plan.trialDays)}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {isTrial
            ? "No card required. Create your account to activate it."
            : "Create your account to continue to checkout."}
        </p>
      </div>
    </div>
  );
};

const AuthDialog = ({
  open,
  onOpenChange,
  defaultTab,
  mode,
  onModeChange,
  onAuthenticated,
  returnTo,
}: AuthDialogProps) => {
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, sendPasswordReset } = useAuth();
  const { resolvedTheme } = useTheme();
  const [view, setView] = useState<View>(() => initialAuthTab(mode, defaultTab, open ? getPendingIntent() : null));
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const pendingIntent = useMemo(() => (open ? getPendingIntent() : null), [open]);
  const tab: "signin" | "signup" = view === "signin" || view === "signup" ? view : "signin";

  useEffect(() => {
    if (!open) return;
    const initialTab = initialAuthTab(mode, defaultTab, pendingIntent);
    setView(initialTab);
    setFormError(null);
    setMagicLinkMode(false);
    setMagicLinkSent(false);
    trackConversionEvent("auth_started", {
      defaultTab: initialTab,
      hasPendingPlan: Boolean(pendingIntent),
      intent: pendingIntent?.action ?? "none",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copy = authDialogCopy(pendingIntent, tab);

  const logo = resolvedTheme === "dark" ? skinlabsLogoWhite : skinlabsLogoBlack;

  // OAuth / email-confirmation redirect target: the pending intent's returnTo,
  // else the caller's returnTo, else this page. Same-origin paths only — never
  // an open redirect. The intent rides along in the URL (withPendingIntentParams)
  // so <IntentResolver /> can resume it even in a new tab.
  const oauthRedirect = () => {
    const latest = getPendingIntent() ?? pendingIntent;
    const path = latest?.returnTo ?? (isSafeReturnTo(returnTo) ? returnTo : window.location.pathname);
    return withPendingIntentParams(`${window.location.origin}${path}`, latest);
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setGoogleLoading(true);
    trackConversionEvent("signup_started", { method: "google" });
    const { error } = await signInWithGoogle(oauthRedirect());
    // A successful call redirects the browser to Google immediately — control never
    // returns here. An error means the redirect never happened, so it's safe to
    // reset loading state and surface it.
    if (error) {
      setGoogleLoading(false);
      setFormError(error.message);
      toast.error(error.message);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!AUTH_FLAGS.magicLinkEnabled) return;
    setFormError(null);
    setIsLoading(true);
    trackConversionEvent("signup_started", { method: "magic_link" });
    const { error } = await signInWithMagicLink(email, oauthRedirect());
    setIsLoading(false);
    if (error) {
      setFormError(error.message);
      toast.error(error.message);
    } else setMagicLinkSent(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setFormError(error.message);
      toast.error(error.message);
    } else {
      trackConversionEvent("signin_completed");
      toast.success("Welcome back.");
      onOpenChange(false);
      onAuthenticated?.();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    trackConversionEvent("signup_started", { method: "password" });
    setIsLoading(true);
    // No username at sign-up: the profile trigger assigns a glow_xxxxxx
    // placeholder, and the comment form asks for a real handle the first
    // time it's needed (CommentHandlePrompt).
    const { error } = await signUp(email, password, oauthRedirect(), marketingConsent);
    setIsLoading(false);
    if (error) {
      setFormError(error.message);
      toast.error(error.message);
    } else {
      trackConversionEvent("signup_completed");
      toast.success("You're in. Skincare without the nonsense starts here.");
      onOpenChange(false);
      onAuthenticated?.();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    trackConversionEvent("password_reset_started");
    const { error } = await sendPasswordReset(email);
    setIsLoading(false);
    // Deliberately show the same "check your email" state whether or not the
    // account exists — avoids confirming/denying registered emails to a caller.
    if (error && error.message?.toLowerCase().includes("rate limit")) {
      setFormError("Too many attempts. Please wait a few minutes and try again.");
      return;
    }
    setView("forgot-sent");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          // Full-screen on mobile to avoid a cramped, scroll-heavy modal; a centered card from sm: up.
          "inset-0 top-0 left-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0",
          "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border",
          "flex flex-col overflow-y-auto",
        )}
      >
        <div className="relative shrink-0 border-b border-border bg-gradient-to-b from-muted/60 to-muted/20 px-6 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <img src={logo} alt="SkinLabs®" className="h-8 w-auto" />
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="font-heading text-xl">
                {view === "forgot" || view === "forgot-sent" ? "Reset your password" : copy.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {view === "forgot" || view === "forgot-sent"
                  ? "We'll email you a secure link to set a new password."
                  : copy.description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 py-5">
          {pendingIntent && view !== "forgot" && view !== "forgot-sent" && <PlanContextBanner intent={pendingIntent} />}

          {view === "forgot-sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Check your email</p>
                <p className="text-xs text-muted-foreground">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a
                  link to reset your password. It's valid for a limited time.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setView("signin")}
              >
                <ArrowLeft className="h-3 w-3" /> Back to log in
              </Button>
            </div>
          ) : view === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email-forgot">Email</Label>
                <Input
                  id="email-forgot"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {formError && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {formError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <button
                type="button"
                onClick={() => setView("signin")}
                className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back to log in
              </button>
            </form>
          ) : (
            <>
              <div className="gradient-border-anim rounded-xl border border-transparent bg-background">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2.5 border-0 bg-transparent font-medium hover:bg-muted/60"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </Button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">or continue with email</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Tabs
                value={tab}
                onValueChange={(v) => {
                  const next = v as "signin" | "signup";
                  setView(next);
                  setFormError(null);
                  onModeChange?.(next);
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin" className="gap-1.5 text-xs sm:text-sm">
                    <KeyRound className="h-3.5 w-3.5" /> Log in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="gap-1.5 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5" /> Sign up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-0">
                  {magicLinkSent ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Check your email</p>
                        <p className="text-xs text-muted-foreground">
                          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Open
                          it on this device to log in — no password needed.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setMagicLinkSent(false);
                          setMagicLinkMode(false);
                        }}
                      >
                        Use a different method
                      </Button>
                    </div>
                  ) : magicLinkMode && AUTH_FLAGS.magicLinkEnabled ? (
                    <form onSubmit={handleMagicLink} className="space-y-4" noValidate>
                      <div className="space-y-2">
                        <Label htmlFor="email-magic">Email</Label>
                        <Input
                          id="email-magic"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                        <p className="text-xs text-muted-foreground">
                          We'll email you a one-time link — click it to sign in, no password required.
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send magic link
                      </Button>
                      <button
                        type="button"
                        onClick={() => setMagicLinkMode(false)}
                        className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                      >
                        <KeyRound className="h-3 w-3" /> Use a password instead
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                      <div className="space-y-2">
                        <Label htmlFor="email-signin">Email</Label>
                        <Input
                          id="email-signin"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password-signin">Password</Label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setView("forgot");
                            }}
                            className="text-xs font-medium text-primary hover:underline underline-offset-2"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="password-signin"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {formError && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {formError}
                        </p>
                      )}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Log in
                      </Button>
                      {AUTH_FLAGS.magicLinkEnabled && (
                        <button
                          type="button"
                          onClick={() => setMagicLinkMode(true)}
                          className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                        >
                          Sign in without a password
                        </button>
                      )}
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Password</Label>
                      <div className="relative">
                        <Input
                          id="password-signup"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        At least 8 characters. No confirmation email required — you can verify later from your
                        dashboard.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="marketing-consent-signup"
                        checked={marketingConsent}
                        onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="marketing-consent-signup" className="text-xs font-normal leading-snug text-muted-foreground">
                        Send me skincare tips, new reviews and offers by email (optional). You can unsubscribe any
                        time — see our{" "}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                          privacy policy
                        </a>
                        .
                      </Label>
                    </div>
                    {formError && (
                      <p role="alert" className="text-xs font-medium text-destructive">
                        {formError}
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}

          <p className="mt-5 text-center text-[11px] text-muted-foreground leading-relaxed">
            By continuing you agree to our{" "}
            <a href="/terms-of-service" className="underline hover:text-foreground">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
