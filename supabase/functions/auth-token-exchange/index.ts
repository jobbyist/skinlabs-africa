import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_DOMAINS = [
  "https://skinlabs.co.za",
  "https://www.skinlabs.co.za",
  "https://openhaus.skinlabs.co.za",
  "https://skinlabsza.lovable.app",
  "https://skinlabs-openhaus.lovable.app",
];

const DEFAULT_REDIRECT = "https://openhaus.skinlabs.co.za";

function isAllowedRedirect(target: unknown): target is string {
  if (typeof target !== "string") return false;
  try {
    const u = new URL(target);
    const origin = `${u.protocol}//${u.host}`;
    return ALLOWED_DOMAINS.includes(origin);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { action, code, redirect_to } = await req.json();

    // ACTION: generate — authenticated user requests a one-time code
    if (action === "generate") {
      // Verify caller is authenticated
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check premium subscription
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_status")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.subscription_status !== "premium") {
        return new Response(
          JSON.stringify({ error: "Premium subscription required to access OpenHaus" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a cryptographically random one-time code
      const codeBytes = new Uint8Array(32);
      crypto.getRandomValues(codeBytes);
      const exchangeCode = Array.from(codeBytes, (b) => b.toString(16).padStart(2, "0")).join("");

      // Store code with 60-second expiry
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      const { error: insertError } = await supabaseAdmin
        .from("auth_exchange_codes")
        .insert({ user_id: user.id, code: exchangeCode, expires_at: expiresAt });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to generate code" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean up expired codes
      await supabaseAdmin
        .from("auth_exchange_codes")
        .delete()
        .lt("expires_at", new Date().toISOString());

      return new Response(JSON.stringify({ code: exchangeCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: exchange — target site exchanges code for a session
    if (action === "exchange") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Code required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the code
      const { data: codeRecord, error: lookupError } = await supabaseAdmin
        .from("auth_exchange_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .single();

      if (lookupError || !codeRecord) {
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiry
      if (new Date(codeRecord.expires_at) < new Date()) {
        // Mark as used
        await supabaseAdmin
          .from("auth_exchange_codes")
          .update({ used: true })
          .eq("id", codeRecord.id);

        return new Response(JSON.stringify({ error: "Code expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark code as used immediately (one-time use)
      await supabaseAdmin
        .from("auth_exchange_codes")
        .update({ used: true })
        .eq("id", codeRecord.id);

      // Generate a magic link / session for the user
      // Use admin API to create a session
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        codeRecord.user_id
      );

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a magic link that auto-signs in on the target domain
      const safeRedirect = isAllowedRedirect(redirect_to) ? (redirect_to as string) : DEFAULT_REDIRECT;
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
        options: {
          redirectTo: safeRedirect,
        },
      });

      if (linkError || !linkData) {
        console.error("Link generation error:", linkError);
        return new Response(JSON.stringify({ error: "Failed to create session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract the token from the generated link and return it
      // The link contains a token_hash and type that can be used to verify
      return new Response(
        JSON.stringify({
          access_token: linkData.properties?.access_token,
          refresh_token: linkData.properties?.refresh_token,
          email: user.email,
          user_id: user.id,
          // Also provide the hashed token for OTP verification
          token_hash: linkData.properties?.hashed_token,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auth exchange error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
