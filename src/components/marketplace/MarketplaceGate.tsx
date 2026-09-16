import { useCallback, useEffect, useState, type ReactNode } from "react";
import MarketplaceRestrictedAccess from "@/pages/marketplace/MarketplaceRestrictedAccess";

/**
 * Client gate for all /marketplace/* routes.
 * Auth is validated against /api/marketplace-auth (MARKETPLACE_USERNAME /
 * MARKETPLACE_PASSWORD on Vercel). sessionStorage is only a UX cache —
 * the httpOnly cookie is the source of truth on each cold load.
 */
export function MarketplaceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");

  const verify = useCallback(async () => {
    try {
      const cached = sessionStorage.getItem("marketplace_unlocked");
      if (cached === "1") {
        setStatus("unlocked");
      }
      const res = await fetch("/api/marketplace-auth", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        try {
          sessionStorage.setItem("marketplace_unlocked", "1");
        } catch {
          /* ignore */
        }
        setStatus("unlocked");
        return;
      }
      try {
        sessionStorage.removeItem("marketplace_unlocked");
      } catch {
        /* ignore */
      }
      setStatus("locked");
    } catch {
      try {
        if (sessionStorage.getItem("marketplace_unlocked") === "1") {
          setStatus("unlocked");
          return;
        }
      } catch {
        /* ignore */
      }
      setStatus("locked");
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0b0a] text-stone-400">
        <div className="text-sm tracking-wide">Checking marketplace access…</div>
      </div>
    );
  }

  if (status === "locked") {
    return <MarketplaceRestrictedAccess onUnlocked={() => setStatus("unlocked")} />;
  }

  return <>{children}</>;
}
