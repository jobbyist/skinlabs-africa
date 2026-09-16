import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { getPendingPlan } from "@/lib/pending-plan";

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

  /**
   * Builds a redirect URL that preserves pending plan intent.
   * If a plan is pending, adds it as a query parameter.
   */
  const buildRedirectUrl = (basePath: string = "/dashboard"): string => {
    const pendingPlan = getPendingPlan();
    const url = new URL(window.location.origin + basePath);
    
    if (pendingPlan) {
      url.searchParams.set("plan", pendingPlan);
    }
    
    // Preserve any existing query params from current location
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.forEach((value, key) => {
      if (key !== "plan") url.searchParams.set(key, value);
    });
    
    return url.toString();
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
  const signUp = async (email: string, password: string, username?: string, redirectTo?: string) => {
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: username ? { username } : undefined,
        emailRedirectTo: redirectTo ?? buildRedirectUrl(),
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
  const signInWithGoogle = async (redirectTo?: string) => {
      provider: "google",
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
      options: { redirectTo: redirectTo ?? buildRedirectUrl() },
    return { data, error };
  };

  /** Passwordless sign-in: emails a one-time magic link, no password required. */
  const signInWithMagicLink = async (email: string) => {
  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
      email,
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
      options: { emailRedirectTo: redirectTo ?? buildRedirectUrl() },
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  /** Optional email verification, initiated by the user from the dashboard. */
  const sendEmailVerification = async () => {
    if (!user?.email) return { data: null, error: new Error("No email on this account") };
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
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
    sendEmailVerification,
    enrollMFA,
    challengeAndVerifyMFA,
    listMFAFactors,
    unenrollMFA,
  };
};
