import { useState } from "react";
import { useTheme } from "next-themes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, ShieldAlert, Lock } from "lucide-react";
import skinlabsLogoBlack from "@/assets/skinlabs-logo-black.svg";
import skinlabsLogoWhite from "@/assets/skinlabs-logo-white.svg";

const ADMIN_EMAIL = "admin@skinlabs.co.za";

interface AdminLoginScreenProps {
  status: "checking" | "locked" | "unavailable";
  error: string | null;
  submitting: boolean;
  onSubmit: (password: string) => void;
}

/**
 * Dedicated administrator-only sign-in — deliberately separate from the
 * consumer AuthDialog. Identity is fixed to admin@skinlabs.co.za; the
 * password is validated server-side in api/admin-auth.ts against the
 * ADMIN_PASSWORD Vercel secret, never here.
 */
const AdminLoginScreen = ({ status, error, submitting, onSubmit }: AdminLoginScreenProps) => {
  const { resolvedTheme } = useTheme();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const logo = resolvedTheme === "dark" ? skinlabsLogoWhite : skinlabsLogoBlack;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    onSubmit(password);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex min-h-[80vh] items-center justify-center pt-20 pb-16">
        <div className="w-full max-w-sm px-4">
          <Card className="border-border/80">
            <CardHeader className="items-center text-center">
              <img src={logo} alt="SkinLabs®" className="mb-3 h-7 w-auto" />
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3 w-3" /> Administrator area
              </div>
              <CardTitle>Admin sign in</CardTitle>
              <CardDescription>This area is restricted to SkinLabs® staff.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "unavailable" ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <ShieldAlert className="h-8 w-8 text-amber-500" />
                  <p className="text-sm text-muted-foreground">
                    Admin login isn't configured for this environment yet. Set the <code>ADMIN_PASSWORD</code>{" "}
                    environment variable and try again.
                  </p>
                </div>
              ) : status === "checking" ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input id="admin-email" type="email" value={ADMIN_EMAIL} readOnly disabled autoComplete="username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
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
                  </div>
                  {error && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={submitting || !password}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
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

export default AdminLoginScreen;
