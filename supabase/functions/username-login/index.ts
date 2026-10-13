import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Same message for "no such username" and "wrong password", so the response never confirms a username exists. */
const INVALID = { error: "Invalid login credentials" };
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Password sign-in by username. The browser never learns the email: this function resolves it with the
 * service role, signs in against GoTrue, and returns only the session tokens (the client then calls
 * supabase.auth.setSession). Emails still sign in directly through supabase.auth.signInWithPassword.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!USERNAME.test(username) || password.length < 1 || password.length > 256) return json(INVALID, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("username", username.replace(/[\\%_]/g, (c) => `\\${c}`))
    .maybeSingle();
  if (profileError) return json({ error: "Sign-in is unavailable right now. Try again shortly." }, 503);
  if (!profile) return json(INVALID, 400);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.user_id);
  const email = userData?.user?.email;
  if (userError || !email) return json(INVALID, 400);

  const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      ...(req.headers.get("x-forwarded-for") ? { "X-Forwarded-For": req.headers.get("x-forwarded-for")! } : {}),
    },
    body: JSON.stringify({ email, password }),
  });
  const session = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !session?.access_token || !session?.refresh_token) {
    // Pass GoTrue's own throttling through; everything else is the generic message.
    if (tokenRes.status === 429) return json({ error: "Too many attempts. Please wait a moment and try again." }, 429);
    return json(INVALID, 400);
  }
  return json({ access_token: session.access_token, refresh_token: session.refresh_token });
});
