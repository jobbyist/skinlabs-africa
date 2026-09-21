// Public, unauthenticated one-click unsubscribe — the token in the URL IS
// the credential (same security model as a password-reset link), so no
// login is required. Handles both:
//  - GET: a human clicking the link in an email client -> unsubscribes
//    immediately and returns a small branded HTML confirmation page.
//  - POST: RFC 8058 List-Unsubscribe-Post, sent automatically by mail
//    clients (Gmail/Yahoo's 2024 bulk-sender rules require this) -> same
//    immediate unsubscribe, minimal plain-text response (no mail client
//    renders this as a page).
// Both paths call the same idempotent unsubscribe_marketing() RPC.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BRAND = {
  accent: "#16a34a",
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  bg: "#f4f4f5",
  surface: "#ffffff",
};

function confirmationPage(success: boolean): string {
  const heading = success ? "You're unsubscribed" : "Link not recognized";
  const body = success
    ? "You won't receive any more SkinLabs marketing emails. You'll still get transactional emails about your account, orders and analyses."
    : "This unsubscribe link isn't valid or has already been used. If you're still receiving marketing email you didn't ask for, contact support@skinlabs.co.za.";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SkinLabs — Unsubscribe</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:${BRAND.surface};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td style="padding:40px 32px;text-align:center;">
                <h1 style="margin:0 0 12px 0;font-size:20px;color:${BRAND.text};">${heading}</h1>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:22px;color:${BRAND.muted};">${body}</p>
                <a href="https://skinlabs.co.za" style="display:inline-block;padding:10px 20px;font-size:14px;font-weight:600;color:#ffffff;background-color:${BRAND.accent};border-radius:8px;text-decoration:none;">Back to SkinLabs</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const isPost = req.method === "POST";

  if (!UUID_RE.test(token)) {
    return isPost
      ? new Response("OK", { status: 200 })
      : new Response(confirmationPage(false), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: success, error } = await admin.rpc("unsubscribe_marketing", { p_token: token });
  if (error) {
    console.error("email-unsubscribe: RPC failed", error);
  }

  if (isPost) {
    return new Response("OK", { status: 200 });
  }
  return new Response(confirmationPage(Boolean(success)), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
