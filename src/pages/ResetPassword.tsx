import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { trackConversionEvent } from "@/lib/analytics-events";
import skinlabsLogoBlack from "@/assets/skinlabs-logo-black.svg";
import skinlabsLogoWhite from "@/assets/skinlabs-logo-white.svg";

/**
 * Lands here from the Supabase password-recovery email (see
 * useAuth().sendPasswordReset -> resetPasswordForEmail's redirectTo).
 * supabase-js's detectSessionInUrl automatically exchanges the recovery
 * token in the URL for a PASSWORD_RECOVERY session on load — this page just
 * waits for that, then lets the visitor set a new password via
 * supabase.auth.updateUser(). An expired/invalid/already-used link never
 * produces that session, which is how the "invalid link" state below is
 * detected — no separate token-validation endpoint needed.
 */
type Status = "checking" | "ready" | "invalid" | "submitting" | "done";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { resolvedTheme } = useTheme();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Give supabase-js a moment to process the recovery token from the URL hash.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setStatus(data.session ? "ready" : "invalid");
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });
    void check();
    const timeout = window.setTimeout(check, 800);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const logo = resolvedTheme === "dark" ? skinlabsLogoWhite : skinlabsLogoBlack;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setStatus("submitting");
    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setStatus("ready");
      setError(updateError.message);
      return;
    }
    trackConversionEvent("password_reset_completed");
    setStatus("done");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Reset your password | SkinLabs®</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="pt-28 pb-24">
        <div className="container mx-auto max-w-md px-4">
          <Card>
            <CardHeader className="items-center text-center">
              <img src={logo} alt="SkinLabs®" className="mb-2 h-7 w-auto" />
              <CardTitle>
                {status === "done" ? "Password updated" : status === "invalid" ? "Link expired" : "Set a new password"}
              </CardTitle>
              <CardDescription>
                {status === "checking" && "Verifying your reset link…"}
                {status === "ready" && "Choose a new password for your SkinLabs® account."}
                {status === "invalid" &&
                  "This password reset link is invalid or has expired. Request a new one to continue."}
                {status === "submitting" && "Updating your password…"}
                {status === "done" && "You can now log in with your new password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "checking" && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {status === "invalid" && (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                  <Button onClick={() => navigate("/")}>Back to home</Button>
                </div>
              )}

              {status === "done" && (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
                </div>
              )}

              {(status === "ready" || status === "submitting") && (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        autoFocus
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
                    <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  {error && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={status === "submitting"}>
                    {status === "submitting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
