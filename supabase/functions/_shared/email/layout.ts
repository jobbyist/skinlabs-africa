// Shared HTML shell for every SkinLabs transactional email. Plain
// string-template functions rather than React Email: Supabase's Deno edge
// runtime makes a JSX/npm render pipeline meaningfully more fragile here for
// no real benefit, and plain functions are directly unit-testable with this
// repo's existing bun:test pure-function convention. Table-based markup +
// inline CSS throughout for Gmail/Outlook/Apple Mail compatibility.

export const BRAND = {
  name: "SkinLabs® South Africa",
  supportEmail: "support@skinlabs.co.za",
  siteUrl: "https://skinlabs.co.za",
  logoUrl: "https://skinlabs.co.za/email/skinlabs-logo.png",
  instagramUrl: "https://www.instagram.com/skinlabsza",
  tiktokUrl: "https://www.tiktok.com/@skinlabsza",
  // Buttons follow the site's design system: the brand gradient (the same
  // four stops as --gradient-brand in src/index.css) over a monochrome ink
  // fallback colour, which is what Outlook (no CSS gradients) renders.
  ink: "#18181b",
  gradient: "linear-gradient(135deg,#22c55e,#3b82f6,#a855f7,#ec4899)",
  gradientStops: ["#22c55e", "#3b82f6", "#a855f7", "#ec4899"],
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  bg: "#f4f4f5",
  surface: "#ffffff",
} as const;

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

// Reusable signature block — every template renders through
// renderEmailLayout(), so this is never duplicated per-template.
export function renderSignature(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid ${BRAND.border};padding-top:24px;">
      <tr>
        <td>
          <a href="${BRAND.siteUrl}" target="_blank" rel="noopener noreferrer">
            <img src="${BRAND.logoUrl}" alt="SkinLabs" width="120" style="display:block;height:auto;border:0;outline:none;text-decoration:none;margin-bottom:12px;" />
          </a>
          <p style="margin:0;font-size:13px;line-height:20px;color:${BRAND.muted};">
            <strong style="color:${BRAND.text};">${BRAND.name}</strong><br/>
            <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.muted};text-decoration:underline;">${BRAND.supportEmail}</a><br/>
            <a href="${BRAND.siteUrl}" style="color:${BRAND.muted};text-decoration:underline;" target="_blank" rel="noopener noreferrer">skinlabs.co.za</a><br/>
            <a href="${BRAND.instagramUrl}" style="color:${BRAND.muted};text-decoration:underline;" target="_blank" rel="noopener noreferrer">Instagram</a>
            &nbsp;&middot;&nbsp;
            <a href="${BRAND.tiktokUrl}" style="color:${BRAND.muted};text-decoration:underline;" target="_blank" rel="noopener noreferrer">TikTok</a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

export interface EmailLayoutOptions {
  preheader: string;
  bodyHtml: string;
  /**
   * One-click marketing unsubscribe URL for this recipient. When absent the
   * footer falls back to an unsubscribe-by-email link, so every recipient-facing
   * email always carries one. Pass `internal: true` for staff notifications.
   */
  unsubscribeUrl?: string | null;
  /** Staff/admin notifications don't carry an unsubscribe link. */
  internal?: boolean;
}

export const UNSUBSCRIBE_MAILTO = `mailto:${BRAND.supportEmail}?subject=Unsubscribe`;

/** Footer line shown under every recipient-facing email. */
export function renderFooterNotice({ unsubscribeUrl, internal }: Pick<EmailLayoutOptions, "unsubscribeUrl" | "internal">): string {
  if (internal) return "This is an internal SkinLabs® notification.";
  const href = escapeHtml(unsubscribeUrl || UNSUBSCRIBE_MAILTO);
  return `You're receiving this because you have a SkinLabs® account or contacted us directly.<br/>
    Don't want marketing emails? <a href="${href}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>.
    You'll still get essential emails about your account, payments and analyses.`;
}

// The hidden preheader span is the standard trick for controlling the
// preview-text Gmail/Apple Mail show next to the subject line.
export function renderEmailLayout({ preheader, bodyHtml, unsubscribeUrl, internal }: EmailLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>SkinLabs</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${BRAND.surface};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
            <tr>
              <td style="height:4px;line-height:4px;font-size:0;background-color:${BRAND.ink};background-image:${BRAND.gradient};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <a href="${BRAND.siteUrl}" target="_blank" rel="noopener noreferrer">
                  <img src="${BRAND.logoUrl}" alt="SkinLabs" width="140" style="display:block;height:auto;border:0;outline:none;text-decoration:none;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;color:${BRAND.text};font-size:15px;line-height:24px;">
                ${bodyHtml}
                ${renderSignature()}
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:16px 8px;color:${BRAND.muted};font-size:12px;line-height:18px;">
                ${renderFooterNotice({ unsubscribeUrl, internal })}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
