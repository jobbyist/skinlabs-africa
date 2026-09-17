import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trackConversionEvent } from "@/lib/analytics-events";

export type AdminGateStatus = "checking" | "locked" | "unlocked" | "unavailable";

/**
 * Client side of the /admin password gate (api/admin-auth.ts). Verified
 * server-side on every check — this hook never decides access on its own,
 * it only reflects what the server's cookie check and admin.generateLink
 * bridge returned. See api/admin-auth.ts for the full design rationale.
 */
export const useAdminGate = () => {
  const { verifyRecoveryOrMagicLinkToken, signOut } = useAuth();
  const [status, setStatus] = useState<AdminGateStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionBridged, setSessionBridged] = useState(false);

  const checkGate = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-auth", { method: "GET" });
      if (res.status === 503) {
        setStatus("unavailable");
        return;
      }
      setStatus(res.ok ? "unlocked" : "locked");
    } catch {
      setStatus("locked");
    }
  }, []);

  useEffect(() => {
    void checkGate();
  }, [checkGate]);

  const submit = async (password: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; tokenHash?: string | null };
      if (!res.ok || !data.ok) {
        trackConversionEvent("admin_login_failure");
        setError(res.status === 503 ? "Admin login is not configured. Contact engineering." : "Invalid credentials.");
        setSubmitting(false);
        return;
      }
      trackConversionEvent("admin_login_success");
      if (data.tokenHash) {
        const { error: otpError } = await verifyRecoveryOrMagicLinkToken(data.tokenHash, "magiclink");
        setSessionBridged(!otpError);
      }
      setStatus("unlocked");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin-auth", { method: "DELETE" });
    } catch {
      /* the local sign-out below still clears the session regardless */
    }
    await signOut();
    setSessionBridged(false);
    setStatus("locked");
  };

  return { status, error, submitting, submit, logout, sessionBridged };
};
