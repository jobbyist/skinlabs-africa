import { useState } from "react";
import { MailCheck, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/** Email confirmation is optional at sign-up; members can verify here for extra security. */
const EmailVerificationCard = () => {
  const { user, sendEmailVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const verified = Boolean(user?.email_confirmed_at ?? user?.confirmed_at);

  const handleSend = async () => {
    setSending(true);
    const { error } = await sendEmailVerification();
    setSending(false);
    if (error) {
      toast.error(error.message || "Could not send the verification email");
      return;
    }
    setSent(true);
    toast.success("Verification email sent — check your inbox.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailCheck className="h-5 w-5" />
          Email verification
          <Badge variant={verified ? "default" : "secondary"} className="ml-1">
            {verified ? "Verified" : "Optional"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Verifying {user?.email} is optional, but it protects account recovery and payment receipts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {verified ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Your email address is confirmed.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              We'll send a one-click confirmation link. You can keep using SkinLabs either way.
            </p>
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {sent ? "Resend verification email" : "Verify my email"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerificationCard;
