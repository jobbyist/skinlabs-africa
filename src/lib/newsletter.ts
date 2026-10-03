import { supabase } from "@/integrations/supabase/client";
import { trackConversionEvent } from "@/lib/analytics-events";

/**
 * Weekly-digest signup (double opt-in). The client only ever calls the
 * SECURITY DEFINER RPCs in supabase/migrations/20261003090000_newsletter_double_opt_in.sql:
 * a visitor is 'pending' until they press the button on the emailed link.
 * The consent wording shown next to the form is owned by the server
 * (stored with a version on the row); NEWSLETTER_CONSENT_TEXT here must match it.
 */
export const NEWSLETTER_CONSENT_TEXT =
  "Email me the SkinLabs weekly digest (new briefings, reviews and ingredient guides). I can unsubscribe at any time.";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidNewsletterEmail(raw: string): boolean {
  const email = normaliseEmail(raw);
  return email.length >= 3 && email.length <= 255 && EMAIL_RE.test(email);
}

/** A placement id the server will accept ([a-z0-9_:-], max 64); anything else becomes "unknown". */
export function sanitiseSource(raw: string): string {
  return /^[a-z0-9_:-]{1,64}$/.test(raw) ? raw : "unknown";
}

export type SubscribeResult = "pending" | "invalid_email" | "error";

export async function subscribeToDigest(rawEmail: string, source: string): Promise<SubscribeResult> {
  if (!isValidNewsletterEmail(rawEmail)) return "invalid_email";
  const safeSource = sanitiseSource(source);
  const { error } = await supabase.rpc("subscribe_newsletter", {
    p_email: normaliseEmail(rawEmail),
    p_source: safeSource,
    p_source_path: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
  if (error) {
    trackConversionEvent("newsletter_signup_failed", { source: safeSource });
    return error.code === "22023" ? "invalid_email" : "error";
  }
  trackConversionEvent("newsletter_signup_submitted", { source: safeSource });
  return "pending";
}

export type ConfirmResult = "confirmed" | "already" | "invalid" | "error";

export async function confirmDigest(token: string): Promise<ConfirmResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return "invalid";
  const { data, error } = await supabase.rpc("confirm_newsletter", { p_token: token });
  if (error) return "error";
  if (data === "confirmed") trackConversionEvent("newsletter_confirmed", {});
  return data === "confirmed" || data === "already" ? data : "invalid";
}
