/**
 * iOS fires no `appinstalled`, so the first STANDALONE launch is the install signal. mark_app_installed() is a
 * SECURITY DEFINER RPC (profiles.app_installed_at, set once; the column has no client grant) that already exists on
 * the live project (20261003200900_notification_engine_core.sql). The local flag only avoids repeat calls.
 */
import { supabase } from "@/integrations/supabase/client";
import { local } from "./storageUtil";

const markedKey = (userId: string) => `skinlabs_app_installed_marked_${userId}`;

export interface AppInstalledDeps {
  callRpc: () => PromiseLike<{ error: { message: string } | null }>;
}
const real: AppInstalledDeps = { callRpc: () => supabase.rpc("mark_app_installed") };
let deps = real;
export const __setAppInstalledDepsForTests = (next: AppInstalledDeps | null) => {
  deps = next ?? real;
};

/** Best effort and idempotent: true when the server has (or already had) the timestamp. */
export const markAppInstalledOnce = async (userId: string, isStandalone: boolean): Promise<boolean> => {
  if (!isStandalone || local.get(markedKey(userId)) === "1") return false;
  try {
    const { error } = await deps.callRpc();
    if (error) return false;
    local.set(markedKey(userId), "1");
    return true;
  } catch {
    return false;
  }
};
