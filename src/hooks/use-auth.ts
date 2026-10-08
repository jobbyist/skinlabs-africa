import { getSiteOrigin } from "@/lib/siteOrigin";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError, type User, type Session } from "@supabase/supabase-js";
import { isEmailIdentifier } from "@/lib/username";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** `identifier` is an email address or a username; usernames are resolved server-side (username-login). */
  const signIn = async (identifier: string, password: string) => {
    const value = identifier.trim();
    if (isEmailIdentifier(value)) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: value, password });
      return { data, error };
    }
    const { data: tokens, error: fnError } = await supabase.functions.invoke<{
      access_token?: string;
      refresh_token?: string;
      error?: string;
    }>("username-login", { body: { username: value, password } });
    if (fnError || !tokens?.access_token || !tokens.refresh_token) {
      let message = "Invalid login credentials";
      try {
        const body = await (fnError as { context?: Response } | null)?.context?.json();
        if (body?.error) message = body.error;
      } catch {
        /* keep the generic message */
      }
      return { data: { user: null, session: null }, error: new AuthError(message, 400, "invalid_credentials") };
    }
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    return { data: { user: data.user, session: data.session }, error };
  };

  /**
   * Email + password only. The profile trigger (handle_new_user) assigns a
   * glow_xxxxxx placeholder username; the member picks a real handle the
   * first time they comment.
   */
  const signUp = async (email: string, password: string, redirectTo?: string, marketingConsent?: boolean) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo ?? getSiteOrigin(),
        data: marketingConsent ? { marketing_consent: true } : undefined,
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo ?? `${getSiteOrigin()}${window.location.pathname}` },
    });
    return { data, error };
  };

  /**
   * Passwordless sign-in: emails a one-time magic link, no password required.
   * Temporarily disabled site-wide via AUTH_FLAGS.magicLinkEnabled (see
   * src/lib/auth-flags.ts) while SMTP delivery is unreliable — the function
   * itself is left intact so it can be re-enabled with a single flag flip.
   */
  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo ?? `${getSiteOrigin()}${window.location.pathname}` },
    });
    return { data, error };
  };

  const signOut = async () => {
    // Detach this device's push subscription from the account first (best effort, time-boxed) so the next
    // person to use it isn't sent this member's notifications. Never blocks or fails sign-out.
    try {
      await Promise.race([
        import("@/lib/pwa/notificationManager").then((m) => m.detachDeviceForSignOut()),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      /* ignore */
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  /**
   * Forgot-password: emails a recovery link via Supabase's own recovery flow
   * (no custom token/reset system). Deliberately returns success-shaped
   * results even on failure paths that would otherwise leak whether an
   * email is registered — see callers for the account-enumeration handling.
   */
  const sendPasswordReset = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteOrigin()}/reset-password`,
    });
    return { data, error };
  };

  /** Completes a password reset — call once a recovery session is active (see /reset-password). */
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  };

  /** Optional email verification, initiated by the user from the dashboard. */
  const sendEmailVerification = async () => {
    if (!user?.email) return { data: null, error: new Error("No email on this account") };
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${getSiteOrigin()}/dashboard` },
    });
    return { data, error };
  };

  /** Multi-factor authentication (TOTP) helpers */
  const enrollMFA = async (friendlyName = "Authenticator app") => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });
    return { data, error };
  };

  const challengeAndVerifyMFA = async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    return { data, error };
  };

  const listMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  };

  const unenrollMFA = async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
    sendPasswordReset,
    updatePassword,
    sendEmailVerification,
    enrollMFA,
    challengeAndVerifyMFA,
    listMFAFactors,
    unenrollMFA,
  };
};
