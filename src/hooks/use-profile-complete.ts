import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface ProfileCompletion {
  loading: boolean;
  isSignedIn: boolean;
  isComplete: boolean;
  username: string | null;
  missing: string[];
  refresh: () => void;
}

const REQUIRED: { key: string; label: string }[] = [
  { key: "username", label: "Username" },
  { key: "full_name", label: "Full name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "skin_color", label: "Skin type (Fitzpatrick)" },
];

/**
 * Commenting on briefings and reviews requires a completed profile. The
 * database enforces this in RLS via is_profile_complete(); this hook mirrors
 * the same rule in the UI so members get a helpful prompt instead of an error.
 */
export const useProfileComplete = (): ProfileCompletion => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        if (!active) return;
        setIsComplete(false);
        setUsername(null);
        setMissing(REQUIRED.map((r) => r.label));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name, date_of_birth, skin_color")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const row = (data ?? {}) as Record<string, string | null>;
      const gaps = REQUIRED.filter((field) => !String(row[field.key] ?? "").trim()).map((f) => f.label);
      setUsername(row.username ?? null);
      setMissing(gaps);
      setIsComplete(gaps.length === 0);
      setLoading(false);
    };
    if (!authLoading) void load();
    return () => {
      active = false;
    };
  }, [user, authLoading, nonce]);

  return {
    loading: loading || authLoading,
    isSignedIn: Boolean(user),
    isComplete,
    username,
    missing,
    refresh: () => setNonce((n) => n + 1),
  };
};
