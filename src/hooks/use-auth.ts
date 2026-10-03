import { getSiteOrigin } from "@/lib/siteOrigin";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
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
