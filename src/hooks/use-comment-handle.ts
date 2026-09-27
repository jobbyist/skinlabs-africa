import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { commentDisplayName, handleValidationError, type HandleProfile } from "@/lib/commentHandle";

/**
 * The signed-in member's public comment handle. `handle` is null until they
 * choose one (see src/lib/commentHandle.ts); `saveHandle` validates it,
 * checks availability with is_username_available() and writes
 * profiles.username, which clears profiles.username_generated server-side —
 * so the prompt only ever appears once.
 */
export const useCommentHandle = (userId: string | null | undefined) => {
  const [profile, setProfile] = useState<HandleProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select("username, username_generated")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** Returns an error message, or null once the handle is saved. */
  const saveHandle = useCallback(
    async (raw: string): Promise<string | null> => {
      if (!userId) return "Sign in first.";
      const invalid = handleValidationError(raw);
      if (invalid) return invalid;
      const handle = raw.trim();
      const { data: available, error: checkError } = await supabase.rpc("is_username_available", {
        p_username: handle,
      });
      if (checkError) return "Couldn't check that handle. Try again.";
      if (available === false) return "That handle is taken. Try another.";
      const { error } = await supabase.from("profiles").update({ username: handle }).eq("user_id", userId);
      if (error) {
        return error.code === "23505" || error.message?.includes("profiles_username")
          ? "That handle is taken. Try another."
          : "Couldn't save your handle. Try again.";
      }
      setProfile({ username: handle, username_generated: false });
      return null;
    },
    [userId],
  );

  return { loading, handle: commentDisplayName(profile), saveHandle };
};
