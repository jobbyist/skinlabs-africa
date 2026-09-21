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

export function emailButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
      <tr>
        <td style="border-radius:8px;background-color:${BRAND.accent};">
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
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
