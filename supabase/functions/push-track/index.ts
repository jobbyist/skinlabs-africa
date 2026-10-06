/**
 * push-track — records that a push notification was tapped.
 *
 * The service worker has no session, so verify_jwt = false. POST {d: <delivery uuid>} → rpc record_push_click, which
 * sets push_deliveries.clicked_at and marks the matching inbox row read. The endpoint ALWAYS answers 200 with an empty
 * body, whatever the input or result, so it can't be used to test which delivery ids exist. Body capped at 512 bytes.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { parseTrackBody } from "../_shared/push/notificationDispatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok = () => new Response(null, { status: 200, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (req.method === "POST") {
      const declared = Number(req.headers.get("content-length") ?? "0");
      if (!(declared > 512)) {
        const deliveryId = parseTrackBody(await req.text());
        const url = Deno.env.get("SUPABASE_URL");
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (deliveryId && url && key) {
          const db = createClient(url, key, { auth: { persistSession: false } });
          await db.rpc("record_push_click", { p_delivery_id: deliveryId });
        }
      }
    }
  } catch {
    // swallow: the response must not depend on the outcome
  }
  return ok();
});
