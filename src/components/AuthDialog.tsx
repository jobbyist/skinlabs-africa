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

const AuthDialog = ({ open, onOpenChange, defaultTab = "signin", onAuthenticated }: AuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

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
      trackConversionEvent("signup");
      toast.success("You're in. Skincare without the nonsense starts here.");
      onOpenChange(false);
      onAuthenticated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="border-b border-border bg-muted/40 px-6 py-5">
          <div className="flex flex-col items-center text-center gap-3">
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
