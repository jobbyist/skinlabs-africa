import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type MembershipTier = "explorer" | "insider" | "vip";

/**
 * Resolves the signed-in member's tier from their profile subscription status.
 * Signed-out visitors and free accounts resolve to "explorer".
 */
export const useMembership = () => {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<MembershipTier>("explorer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        if (active) {
          setTier("explorer");
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const status = (data?.subscription_status || "").toLowerCase();
      setTier(status === "vip" ? "vip" : status === "active" || status === "insider" ? "insider" : "explorer");
      setLoading(false);
    };
    if (!authLoading) void load();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return {
    tier,
    loading: loading || authLoading,
    isSignedIn: Boolean(user),
    isMember: tier !== "explorer",
    isVip: tier === "vip",
  };
};
