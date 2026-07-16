import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface MFAFactor {
  id: string;
  status: string;
  friendly_name?: string | null;
}

const MFASettingsCard = () => {
  const { enrollMFA, challengeAndVerifyMFA, listMFAFactors, unenrollMFA } = useAuth();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const refresh = async () => {
    const { data } = await listMFAFactors();
    const totp = (data?.totp ?? []) as MFAFactor[];
    setFactors(totp);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verified = factors.some((f) => f.status === "verified");

  const handleStartEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await enrollMFA("SKINLABS Authenticator");
    setEnrolling(false);
    if (error || !data) {
      toast.error(error?.message || "Could not start MFA enrollment");
      return;
    }
    const totp = (data as { id: string; totp: { qr_code: string; secret: string } });
    setPendingFactorId(totp.id);
    setQr(totp.totp.qr_code);
    setSecret(totp.totp.secret);
  };

  const handleVerify = async () => {
    if (!pendingFactorId || !code.trim()) return;
    const { error } = await challengeAndVerifyMFA(pendingFactorId, code.trim());
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Multi-factor authentication enabled");
    setPendingFactorId(null);
    setQr(null);
    setSecret(null);
    setCode("");
    refresh();
  };

  const handleCancelEnroll = async () => {
    if (pendingFactorId) await unenrollMFA(pendingFactorId);
    setPendingFactorId(null);
    setQr(null);
    setSecret(null);
    setCode("");
  };

  const handleDisable = async (id: string) => {
    const { error } = await unenrollMFA(id);
    if (error) toast.error(error.message);
    else {
      toast.success("MFA disabled");
      refresh();
    }
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Soft prompt for users who haven't enabled MFA yet
  if (!verified && !pendingFactorId && dismissed) return null;

  return (
    <Card className={!verified ? "border-amber-500/40 bg-amber-500/5" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {verified ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          )}
          Multi-factor authentication
          {verified && <Badge variant="default" className="ml-2">Enabled</Badge>}
        </CardTitle>
        <CardDescription>
          {verified
            ? "Your account is protected with an extra verification step at sign-in."
            : "Add a second verification step using an authenticator app (Google Authenticator, 1Password, Authy)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingFactorId && qr ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-white p-3 rounded-lg border">
                {/* Supabase returns the QR as an SVG data URI */}
                <img src={qr} alt="MFA QR code" className="h-44 w-44" />
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-sm text-muted-foreground">
                  1. Scan the QR code with your authenticator app.
                </p>
                {secret && (
                  <div className="space-y-1">
                    <Label className="text-xs">Or enter this code manually:</Label>
                    <div className="flex gap-2">
                      <Input value={secret} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={handleCopySecret}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="mfa-code" className="text-xs">
                    2. Enter the 6-digit code from your app
                  </Label>
                  <Input
                    id="mfa-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="font-mono tracking-widest text-lg text-center"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVerify} disabled={code.length !== 6} className="flex-1">
                    Verify & enable
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEnroll}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : verified ? (
          <div className="space-y-2">
            {factors
              .filter((f) => f.status === "verified")
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded border border-border bg-background"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {f.friendly_name || "Authenticator app"}
                    </p>
                    <p className="text-xs text-muted-foreground">TOTP factor</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisable(f.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleStartEnroll} disabled={enrolling} className="gap-2">
              {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
              <ShieldCheck className="h-4 w-4" />
              Enable MFA
            </Button>
            <Button variant="ghost" onClick={() => setDismissed(true)}>
              Maybe later
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MFASettingsCard;
