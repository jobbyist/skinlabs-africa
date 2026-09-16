// Receives Resend's delivery webhook (sent/delivered/bounced/complained/
// opened/clicked/delivery_delayed) for observability. Resend signs
// webhooks the Svix way: svix-id / svix-timestamp / svix-signature
// headers, HMAC-SHA256 over "<svix-id>.<svix-timestamp>.<raw body>" using
// the webhook's base64 signing secret. svix-id is also the dedup key —
// email_delivery_events.resend_event_id is UNIQUE with ON CONFLICT DO
// NOTHING, so a redelivered webhook never creates a duplicate row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifySignature(secret: string, svixId: string, svixTimestamp: string, rawBody: string, svixSignatureHeader: string): Promise<boolean> {
  const secretB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secretB64),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = bytesToBase64(new Uint8Array(sigBuffer));
  const candidates = svixSignatureHeader
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter((v): v is string => Boolean(v));
  return candidates.some((c) => timingSafeEqual(c, expected));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!RESEND_WEBHOOK_SECRET) {
    console.error("RESEND_WEBHOOK_SECRET is not configured");
    return json({ error: "Webhook not configured" }, 500);
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  const rawBody = await req.text();

  if (!svixId || !svixTimestamp || !svixSignature) {
    return json({ error: "Missing Svix signature headers" }, 400);
  }

  const valid = await verifySignature(RESEND_WEBHOOK_SECRET, svixId, svixTimestamp, rawBody, svixSignature);
  if (!valid) {
    return json({ error: "Invalid signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const eventType = String(payload.type ?? "unknown");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const providerMessageId = typeof data.email_id === "string" ? data.email_id : null;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let outboxId: string | null = null;
  if (providerMessageId) {
    const { data: outboxRow } = await supabaseAdmin
      .from("email_outbox")
      .select("id")
      .eq("provider_message_id", providerMessageId)
      .maybeSingle();
    outboxId = outboxRow?.id ?? null;
  }

  const { error } = await supabaseAdmin
    .from("email_delivery_events")
    .insert({
      outbox_id: outboxId,
      resend_event_id: svixId,
      event_type: eventType,
      provider_message_id: providerMessageId,
      raw_payload: payload,
    })
    .select()
    .single();

  // A unique_violation on resend_event_id means this exact webhook
  // delivery was already recorded (Resend/Svix retry) — not an error.
  if (error && error.code !== "23505") {
    console.error("Failed to record email delivery event", error);
    return json({ error: "Failed to record event" }, 500);
  }

  return json({ ok: true });
});
