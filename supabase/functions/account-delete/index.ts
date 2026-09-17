import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Permanently deletes the calling user's account. Every user-owned table in
 * this schema references auth.users(id) ON DELETE CASCADE, so removing the
 * auth.users row (only possible via the service-role admin API, never from
 * the client) cascades through profiles, recommendations, journal entries,
 * credits, notifications, transactions, etc. There is no soft-delete here —
 * temporary deactivation is a separate, reversible RPC (deactivate_account).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return new Response(JSON.stringify({ error: "Confirmation phrase did not match" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Enqueued BEFORE deleteUser() runs, deliberately: email_events/email_outbox
  // reference auth.users(id) ON DELETE SET NULL (not CASCADE) precisely so
  // this confirmation survives the very deletion it describes, but the
  // recipient_email snapshot still needs to be captured while the claims are
  // available. Best-effort — a failure here must never block account
  // deletion itself.
  const email = (claimsData.claims.email as string | undefined) ?? null;
  if (email) {
    const { error: enqueueError } = await admin.rpc("enqueue_email", {
      p_event_type: "ACCOUNT_DELETED",
      p_event_idempotency_key: `account_deleted:${userId}`,
      p_template_id: "account_deleted",
      p_category: "ACCOUNT",
      p_user_id: userId,
      p_recipient_email: email,
      p_payload: {},
      p_source: "edge:account-delete",
    });
    if (enqueueError) {
      console.warn("account-delete: failed to enqueue ACCOUNT_DELETED email", enqueueError);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("account-delete: failed to delete user", deleteError);
    return new Response(JSON.stringify({ error: "Could not delete your account. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
