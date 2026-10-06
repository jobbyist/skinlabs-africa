import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { rpcMessage } from "@/lib/notificationAdmin";

/**
 * The ONLY way the Notifications area talks to the backend: the engine's admin RPCs, called with the signed-in admin's own
 * session through the normal browser client. No table is queried here and no service-role code exists in the browser; each
 * RPC re-checks the admin role in SQL (a non-admin gets "Admin access required", 42501).
 */
export type AdminNotificationRpc =
  | "admin_notification_overview"
  | "admin_list_notification_templates"
  | "admin_list_notification_automations"
  | "admin_list_notification_campaigns"
  | "admin_list_notification_dispatches"
  | "admin_list_notification_audit"
  | "admin_preview_notification_audience"
  | "admin_save_notification_campaign"
  | "admin_schedule_notification_campaign"
  | "admin_send_notification_campaign_now"
  | "admin_cancel_notification_campaign"
  | "admin_update_notification_automation"
  | "admin_create_notification_automation"
  | "admin_upsert_notification_template"
  | "admin_set_notification_settings"
  | "admin_send_test_notification"
  | "admin_run_notification_automation_now";

type Fns = Database["public"]["Functions"];
export type RpcArgs<F extends AdminNotificationRpc> = Fns[F]["Args"];

export type RpcResult<T> = { ok: true; data: T } | { ok: false; message: string };

const invoke = supabase.rpc.bind(supabase) as unknown as (fn: string, args?: object) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

/** Calls an admin RPC. Never throws: an error comes back with the RPC's own message, unchanged. */
export const callAdmin = async <T = unknown, F extends AdminNotificationRpc = AdminNotificationRpc>(fn: F, args?: RpcArgs<F>): Promise<RpcResult<T>> => {
  try {
    const { data, error } = await invoke(fn, args ?? {});
    if (error) return { ok: false, message: rpcMessage(error) };
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, message: rpcMessage(error) };
  }
};

/** Same, but a failure is shown to the admin as a toast carrying the RPC's message verbatim. */
export const useAdminCall = () =>
  useCallback(async <T = unknown, F extends AdminNotificationRpc = AdminNotificationRpc>(fn: F, args?: RpcArgs<F>, toastId?: string): Promise<RpcResult<T>> => {
    const result = await callAdmin<T, F>(fn, args);
    if (!result.ok) toast.error(result.message, toastId ? { id: toastId } : undefined);
    return result;
  }, []);
