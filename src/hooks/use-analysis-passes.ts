import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * A signed-in user's Analysis Pass balance — the customer-facing name for
 * the existing `ai_credit_transactions` ledger (see `available_ai_credits()`
 * and `credit_packs`, both already used by the Pricing page checkout and the
 * dashboard). The backend ledger is the single source of truth; this hook
 * never derives a balance client-side.
 */
export const useAnalysisPassBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("available_ai_credits", { _user_id: user.id });
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    setBalance(typeof data === "number" ? data : 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, loading, error, refresh };
};
