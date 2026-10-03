import { BRAND, escapeHtml } from "./layout.ts";

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;line-height:28px;font-weight:700;color:${BRAND.text};">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:${BRAND.text};">${html}</p>`;
}

export function emailSection(html: string): string {
  return `<div style="margin:0 0 16px 0;">${html}</div>`;
}

export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

export type EmailButtonVariant = "gradient" | "mono";

/**
 * Primary call to action. "gradient" (default) uses the SkinLabs® brand
 * gradient; "mono" is solid ink. Both set a solid `background-color` first so
 * clients without CSS gradients (Outlook) still show a high-contrast button.
 */
export function emailButton(text: string, url: string, variant: EmailButtonVariant = "gradient"): string {
  const bg =
    variant === "mono"
      ? `background-color:${BRAND.ink};`
      : `background-color:${BRAND.ink};background-image:${BRAND.gradient};`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
      <tr>
        <td style="border-radius:8px;${bg}">
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

type NoticeTone = "info" | "warning" | "danger";

const NOTICE_STYLES: Record<NoticeTone, { bg: string; border: string; text: string }> = {
  info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
  danger: { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d" },
};

export function emailNotice(html: string, tone: NoticeTone = "info"): string {
  const s = NOTICE_STYLES[tone];
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:${s.bg};border:1px solid ${s.border};border-radius:8px;padding:12px 16px;font-size:14px;line-height:20px;color:${s.text};">
          ${html}
        </td>
      </tr>
    </table>
  `;
}

export function emailKeyValueTable(rows: Array<[string, string]>): string {
  const body = rows
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};width:40%;">${escapeHtml(k)}</td>
          <td style="padding:6px 0;font-size:13px;color:${BRAND.text};font-weight:600;">${escapeHtml(v)}</td>
        </tr>
      `
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border-top:1px solid ${BRAND.border};border-bottom:1px solid ${BRAND.border};">${body}</table>`;
}

// ---------------------------------------------------------------------------
// Marketing blocks shared by the daily / weekly / welcome emails. Email
// equivalents of the site's FaithfulToNature banner and the mini SKYNN AI
// card (src/components/briefings/SkynnMiniCta.tsx) — keep the wording in step
// with the SKYNN AI v2.1 rules: the Basic analysis is a free quiz-based skin
// profile, never a diagnosis, never "dermatologist reviewed".
// ---------------------------------------------------------------------------

export const FAITHFUL_TO_NATURE = {
  href: "https://c.trackmytarget.com/?a=s1d2fa&i=r344bf",
  banner: `${BRAND.siteUrl}/affiliates/faithful-to-nature.gif`,
} as const;

/** Labelled sponsored banner. Same affiliate link and artwork as the site component. */
export function emailFaithfulToNature(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="padding:0 0 6px 0;font-size:11px;line-height:14px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Sponsored &middot; Advertisement</td>
      </tr>
      <tr>
        <td style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <a href="${escapeHtml(FAITHFUL_TO_NATURE.href)}" target="_blank" rel="noopener noreferrer sponsored">
            <img src="${escapeHtml(FAITHFUL_TO_NATURE.banner)}" alt="Faithful to Nature — natural and organic products" width="496" style="display:block;width:100%;max-width:496px;height:auto;border:0;" />
          </a>
        </td>
      </tr>
    </table>
  `;
}

/** The mini SKYNN AI card: a compact, free call to action. */
export function emailSkynnMiniCard(opts: { headline?: string; body?: string; cta?: string; url?: string } = {}): string {
  const headline = opts.headline ?? "Curious how this applies to your skin?";
  const body =
    opts.body ??
    "Take the free Basic AI Skin Analysis: a short quiz, about two minutes, and a skin profile and routine matched to your skin type and concerns.";
  const cta = opts.cta ?? "Start my analysis";
  const url = opts.url ?? `${BRAND.siteUrl}/skynn-ai`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;border:1px solid ${BRAND.border};border-radius:14px;background-color:#fafafa;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 4px 0;font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">SKYNN AI &middot; Free</p>
          <p style="margin:0 0 6px 0;font-size:16px;line-height:22px;font-weight:700;color:${BRAND.text};">${escapeHtml(headline)}</p>
          <p style="margin:0 0 12px 0;font-size:13px;line-height:20px;color:${BRAND.muted};">${escapeHtml(body)}</p>
          ${emailButton(cta, url, "mono").replace("margin:8px 0 24px 0", "margin:0")}
        </td>
      </tr>
    </table>
  `;
}
