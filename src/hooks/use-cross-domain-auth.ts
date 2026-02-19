import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OPENHAUS_URL = "https://openhaus.skinlabs.co.za";

export const useCrossDomainAuth = () => {
  const [loading, setLoading] = useState(false);

  const redirectToOpenhaus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-token-exchange", {
        body: { action: "generate" },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Premium subscription required")) {
          toast.error("Premium subscription required to access OpenHaus marketplace.");
          return;
        }
        throw new Error(data.error);
      }

      if (data?.code) {
        // Redirect to OpenHaus with the exchange code
        window.open(
          `${OPENHAUS_URL}/auth-callback?code=${data.code}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Cross-domain auth error:", err);
      toast.error("Failed to authenticate with OpenHaus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { redirectToOpenhaus, loading };
};
