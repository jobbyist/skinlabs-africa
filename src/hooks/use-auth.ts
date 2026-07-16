import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    return { data: null, error: error || null };
  };

  /** Passwordless magic link */
  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
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
    signOut,
    signInWithOAuth,
    signInWithMagicLink,
    enrollMFA,
    challengeAndVerifyMFA,
    listMFAFactors,
    unenrollMFA,
  };
};
