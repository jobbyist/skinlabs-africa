/**
 * SkinLabs® branded PDF kit (jsPDF, runs in the browser).
 *
 * One look for every member-facing PDF: an ink header band with the real
 * SkinLabs® logo, a thin brand-gradient rule, and a footer with the release
 * label and "Page n of N". Monochrome like the site (see
 * docs/SkinLabs-Design-System.pdf); the four gradient stops are the brand
 * gradient from src/index.css. Text only in Helvetica, so nothing needs
 * embedding and the files stay small.
 */
import jsPDF from "jspdf";

export type Rgb = [number, number, number];

export const PDF_BRAND = {
  ink: [23, 23, 23] as Rgb,
  text: [38, 38, 38] as Rgb,
  muted: [107, 114, 128] as Rgb,
  line: [229, 231, 235] as Rgb,
  surface: [245, 245, 244] as Rgb,
  gradient: [
    [34, 197, 94],
    [59, 130, 246],
    [168, 85, 247],
    [236, 72, 153],
  ] as Rgb[],
};

const MARGIN = 48;
const HEADER_H = 96;
const LINE = 13;

let logoCache: Promise<string | null> | null = null;

/** The white SkinLabs® logo as a data URL (cached); null if it can't load. */
export const loadLogoDataUrl = (src = "/logosvgwhite.png"): Promise<string | null> => {
  if (logoCache) return logoCache;
  logoCache = (async () => {
    try {
      if (typeof fetch === "undefined" || typeof FileReader === "undefined") return null;
      const res = await fetch(src);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  })().then((url) => {
    // Only a loaded logo is cached, so one failed fetch doesn't cost every later PDF its logo.
    if (!url) logoCache = null;
    return url;
  });
  return logoCache;
};

export interface BrandDocOptions {
  title: string;
  subtitle: string;
  /** Footer text (release label etc.); page numbers are added automatically. */
  footer: string;
  logoDataUrl?: string | null;
  generatedAt?: Date;
}

export const formatPdfDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

/** Strips markdown emphasis and characters Helvetica can't draw. */
export const pdfText = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/→/g, "->")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, "");

export class BrandDoc {
  readonly doc: jsPDF;
  readonly width: number;
  readonly height: number;
  readonly contentWidth: number;
  y: number;
  private readonly opts: BrandDocOptions;

  constructor(opts: BrandDocOptions) {
    this.opts = opts;
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.width = this.doc.internal.pageSize.getWidth();
    this.height = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.width - MARGIN * 2;
    this.y = 0;
    this.header(true);
  }

  private header(first: boolean) {
    const { doc } = this;
    const h = first ? HEADER_H : 44;
    doc.setFillColor(...PDF_BRAND.ink);
    doc.rect(0, 0, this.width, h, "F");
    // Brand gradient rule: four equal stops.
    const seg = this.width / PDF_BRAND.gradient.length;
    PDF_BRAND.gradient.forEach((c, i) => {
      doc.setFillColor(...c);
      doc.rect(i * seg, h, seg + 0.5, 3, "F");
    });
    const logoH = first ? 26 : 14;
    const logoW = logoH * (804 / 261);
    if (this.opts.logoDataUrl) {
      try {
        doc.addImage(this.opts.logoDataUrl, "PNG", MARGIN, first ? 22 : 15, logoW, logoH);
      } catch {
        this.wordmark(first);
      }
    } else {
      this.wordmark(first);
    }
    doc.setTextColor(255, 255, 255);
    if (first) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(pdfText(this.opts.title), MARGIN, 70);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(212, 212, 212);
      doc.text(pdfText(this.opts.subtitle), MARGIN, 84);
      doc.text(`Generated ${formatPdfDate(this.opts.generatedAt ?? new Date())}`, this.width - MARGIN, 36, { align: "right" });
      doc.text("skinlabs.co.za", this.width - MARGIN, 50, { align: "right" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(212, 212, 212);
      doc.text(pdfText(this.opts.title), this.width - MARGIN, 26, { align: "right" });
    }
    this.y = h + 30;
  }

  private wordmark(first: boolean) {
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(first ? 20 : 11);
    this.doc.text("SkinLabs®", MARGIN, first ? 44 : 27);
  }

  /** Starts a new page when `needed` points won't fit. */
  ensure(needed: number) {
    if (this.y + needed > this.height - MARGIN - 24) {
      this.doc.addPage();
      this.header(false);
    }
  }

  section(title: string) {
    this.ensure(44);
    this.y += 6;
    const { doc } = this;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...PDF_BRAND.ink);
    doc.text(pdfText(title), MARGIN, this.y);
    this.y += 6;
    doc.setDrawColor(...PDF_BRAND.line);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, this.y, MARGIN + this.contentWidth, this.y);
    this.y += 16;
  }

  subheading(text: string) {
    this.ensure(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(...PDF_BRAND.text);
    this.doc.text(pdfText(text), MARGIN, this.y);
    this.y += LINE + 1;
  }

  paragraph(text: string, opts: { muted?: boolean; size?: number } = {}) {
    const { doc } = this;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.muted ? PDF_BRAND.muted : PDF_BRAND.text));
    const lines = doc.splitTextToSize(pdfText(text), this.contentWidth) as string[];
    for (const line of lines) {
      this.ensure(LINE);
      doc.text(line, MARGIN, this.y);
      this.y += LINE;
    }
    this.y += 4;
  }

  bullets(items: string[]) {
    const { doc } = this;
    for (const item of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(pdfText(item), this.contentWidth - 14) as string[];
      this.ensure(lines.length * LINE);
      doc.setFillColor(...PDF_BRAND.ink);
      doc.circle(MARGIN + 3, this.y - 3.2, 1.5, "F");
      doc.setTextColor(...PDF_BRAND.text);
      for (const line of lines) {
        this.ensure(LINE);
        doc.text(line, MARGIN + 12, this.y);
        this.y += LINE;
      }
      this.y += 2;
    }
    this.y += 4;
  }

  /** Two-column label/value rows (label column 36% wide). */
  keyValues(rows: Array<[string, string]>) {
    const { doc } = this;
    const labelW = this.contentWidth * 0.36;
    const valueW = this.contentWidth - labelW - 10;
    for (const [label, value] of rows) {
      doc.setFontSize(9.5);
      const labelLines = doc.splitTextToSize(pdfText(label), labelW) as string[];
      const valueLines = doc.splitTextToSize(pdfText(value || "-"), valueW) as string[];
      const h = Math.max(labelLines.length, valueLines.length) * 12 + 6;
      this.ensure(h);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...PDF_BRAND.muted);
      doc.text(labelLines, MARGIN, this.y);
      doc.setTextColor(...PDF_BRAND.text);
      doc.text(valueLines, MARGIN + labelW + 10, this.y);
      this.y += h - 6;
      doc.setDrawColor(...PDF_BRAND.line);
      doc.setLineWidth(0.4);
      doc.line(MARGIN, this.y - 7, MARGIN + this.contentWidth, this.y - 7);
      this.y += 6;
    }
    this.y += 6;
  }

  /** A shaded box (summary cards, status, disclaimers). */
  callout(title: string, body: string) {
    const { doc } = this;
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(pdfText(body), this.contentWidth - 28) as string[];
    const h = 30 + lines.length * 12;
    this.ensure(h + 8);
    doc.setFillColor(...PDF_BRAND.surface);
    doc.roundedRect(MARGIN, this.y - 4, this.contentWidth, h, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_BRAND.ink);
    doc.text(pdfText(title).toUpperCase(), MARGIN + 14, this.y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_BRAND.text);
    doc.text(lines, MARGIN + 14, this.y + 28);
    this.y += h + 12;
  }

  /** Renders the "## / ### / - / 1." markdown-ish text the Basic engine produces. */
  markdown(text: string) {
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) {
        this.y += 4;
        continue;
      }
      if (line.startsWith("## ")) this.subheading(line.replace(/^##\s*/, ""));
      else if (line.startsWith("### ")) this.subheading(line.replace(/^###\s*/, ""));
      else if (/^[-*•]\s/.test(line)) this.bullets([line.replace(/^[-*•]\s*/, "")]);
      else if (/^\d+\.\s+/.test(line)) this.bullets([line]);
      else this.paragraph(line);
    }
  }

  /** Adds "footer · Page n of N" to every page and returns the document. */
  finish(): jsPDF {
    const { doc } = this;
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF_BRAND.muted);
      doc.text(`${pdfText(this.opts.footer)}  |  Page ${i} of ${total}`, this.width / 2, this.height - 22, { align: "center" });
    }
    return doc;
  }
}

export const safeFileName = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "member";
