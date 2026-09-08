import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound } from "lucide-react";
import logo from "@/assets/newskinlabs.png";
import { trackConversionEvent } from "@/lib/analytics-events";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
  onAuthenticated?: () => void;
}

/** Google's standard four-colour "G" mark. */
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" {...props}>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6c-2 1.5-4.6 2.4-7.7 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.6 5.6C39.9 36.9 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
  </svg>
);

const AuthDialog = ({ open, onOpenChange, defaultTab = "signin", onAuthenticated }: AuthDialogProps) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    trackConversionEvent("signup_started");
    const { error } = await signInWithGoogle();
    // A successful call redirects the browser to Google immediately — control never
    // returns here. An error means the redirect never happened, so it's safe to
    // reset loading state and surface it.
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back.");
      onOpenChange(false);
      onAuthenticated?.();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      toast.error("Username must be 3-20 characters: letters, numbers or underscores.");
      return;
    }
    trackConversionEvent("signup_started");
    setIsLoading(true);
    const { data: available, error: checkError } = await supabase.rpc("is_username_available", {
      p_username: handle,
    });
    if (checkError || available === false) {
      setIsLoading(false);
      toast.error(checkError ? "Could not check that username. Try again." : "That username is already taken.");
      return;
    }
    const { error } = await signUp(email, password, handle);
    setIsLoading(false);
    if (error) toast.error(error.message);
    else {
      trackConversionEvent("signup_completed");
      toast.success("You're in. Skincare without the nonsense starts here.");
      onOpenChange(false);
      onAuthenticated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="relative border-b border-border bg-gradient-to-b from-muted/60 to-muted/20 px-6 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <img src={logo} alt="SkinLabs®" className="h-8 w-auto" />
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="font-heading text-xl">Log in or create an account</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Save reviews, unlock full podcast episodes and build your AI routine — grounded in SA skin and climate.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="gradient-border-anim rounded-xl border border-transparent bg-background">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2.5 border-0 bg-transparent font-medium hover:bg-muted/60"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin" className="gap-1.5 text-xs sm:text-sm">
                <KeyRound className="h-3.5 w-3.5" /> Log in
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-1.5 text-xs sm:text-sm">
                <Mail className="h-3.5 w-3.5" /> Sign up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-4">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username-signup">Username</Label>
                  <Input
                    id="username-signup"
                    type="text"
                    placeholder="glowseeker"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]{3,20}"
                    autoComplete="username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your unique public handle on comments. Letters, numbers and underscores only.
                  </p>
                </div>
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
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters. No confirmation email required — you can verify later from your dashboard.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
