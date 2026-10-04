/**
 * "My Skin Story" — a branded 1080 × 1920 (9:16) PNG of a Basic AI Skin Analysis
 * snapshot, drawn entirely client-side with the native Canvas API. Nothing is
 * uploaded or stored, and the input type has no field for names, emails, ids or
 * photos, so none of those can reach the image.
 *
 * Layout is a vertical flow; optional sections (MST, concerns, actives, routine)
 * collapse when their data is absent. The canvas is exactly 1080 × 1920 CSS-free
 * pixels (no devicePixelRatio scaling), so the exported file is always that size.
 */
import whiteLogoUrl from "@/assets/skinlabs-logo-white.svg";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export interface MySkinStoryData {
  /** e.g. "combination" — rendered upper-case. */
  skinType: string;
  /** Only when it genuinely exists in the analysis (e.g. "Barrier needs support"). */
  secondary?: string;
  /** Self-reported Monk Skin Tone. Omit unless the member chose one. */
  skinTone?: { level: number; hex: string };
  concerns: string[];
  ingredients: string[];
  routineFocus?: { am?: string; pm?: string };
  assessmentDate: Date | string;
  /** Badge text, e.g. "SKYNN AI v2.2 · BETA". */
  aiVersion?: string;
}

export const MAX_CONCERNS = 3;
export const MAX_INGREDIENTS = 3;

export const STORY_FOOTER_URL = "skinlabs.co.za/skynn-ai";
export const STORY_CTA = "Take the free 2-minute Basic AI Skin Analysis";
export const STORY_DISCLAIMER = "Cosmetic and educational insights, not medical advice.";
const STORY_MST_NOTE = " Skin tone is self-reported.";

// ---------------------------------------------------------------- sanitising

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;

/** Trim, drop control/bidi characters, collapse whitespace, cap length with an ellipsis. */
export const cleanLabel = (value: unknown, max = 60): string => {
  if (typeof value !== "string") return "";
  const text = value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : text;
};

const cleanList = (values: unknown, limit: number, max: number): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const label = cleanLabel(v, max);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length === limit) break;
  }
  return out;
};

export interface SanitisedStory {
  skinType: string;
  secondary: string | null;
  skinTone: { level: number; hex: string } | null;
  concerns: string[];
  ingredients: string[];
  routine: { am: string | null; pm: string | null };
  dateLabel: string;
  badge: string;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "04 OCT 2026" in the viewer's local calendar day. Falls back to today for an invalid date. */
export const formatStoryDate = (value: Date | string): string => {
  let d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) d = new Date();
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export const sanitiseStoryData = (data: MySkinStoryData): SanitisedStory => {
  const tone = data.skinTone;
  const validTone =
    tone && Number.isInteger(tone.level) && tone.level >= 1 && tone.level <= 10 && HEX.test(tone.hex) ? tone : null;
  return {
    skinType: cleanLabel(data.skinType, 24).toUpperCase() || "YOUR SKIN",
    secondary: cleanLabel(data.secondary, 40) || null,
    skinTone: validTone ? { level: validTone.level, hex: validTone.hex } : null,
    concerns: cleanList(data.concerns, MAX_CONCERNS, 48),
    ingredients: cleanList(data.ingredients, MAX_INGREDIENTS, 36),
    routine: {
      am: cleanLabel(data.routineFocus?.am, 80) || null,
      pm: cleanLabel(data.routineFocus?.pm, 80) || null,
    },
    dateLabel: formatStoryDate(data.assessmentDate),
    badge: cleanLabel(data.aiVersion, 32).toUpperCase() || "SKYNN AI · BETA",
  };
};

// ------------------------------------------------------------ text measuring

export type MeasureFn = (text: string) => number;

/**
 * Greedy word wrap that never overflows `maxWidth`: over-long words are split by
 * character, and anything beyond `maxLines` is cut with an ellipsis.
 */
export const wrapText = (text: string, maxWidth: number, measure: MeasureFn, maxLines = 2): string[] => {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  const pushWord = (word: string) => {
    if (measure(word) <= maxWidth) return word;
    // Break an unbreakable word into pieces that fit.
    let piece = "";
    for (const ch of Array.from(word)) {
      if (measure(piece + ch) > maxWidth && piece) {
        lines.push(piece);
        piece = "";
      }
      piece += ch;
    }
    return piece;
  };
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = pushWord(word);
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
};

/** Single line, truncated with an ellipsis if it would be wider than `maxWidth`. */
export const fitLine = (text: string, maxWidth: number, measure: MeasureFn): string => {
  if (measure(text) <= maxWidth) return text;
  let t = Array.from(text);
  while (t.length > 1 && measure(`${t.join("").trimEnd()}…`) > maxWidth) t = t.slice(0, -1);
  return `${t.join("").trimEnd()}…`;
};

// ------------------------------------------------------------------- assets

// Mirrors --gradient-brand in src/index.css (canvas can't read a CSS gradient).
const BRAND_STOPS = ["#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
const FONT_HEADING = `"Montserrat", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const FONT_BODY = `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

let logoPromise: Promise<HTMLImageElement | null> | null = null;

const loadLogo = (): Promise<HTMLImageElement | null> => {
  if (!logoPromise) {
    logoPromise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(null), 4000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img.naturalWidth > 0 ? img : null);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      img.src = whiteLogoUrl;
    }).then((img) => {
      if (!img) logoPromise = null; // allow a retry on the next share
      return img;
    });
  }
  return logoPromise;
};

const loadFonts = async () => {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`800 100px "Montserrat"`),
        document.fonts.load(`600 30px "Inter"`),
        document.fonts.load(`400 30px "Inter"`),
      ]).then(() => document.fonts.ready),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Fall through to the system fallbacks in the font stacks.
  }
};

/** Warm the logo + fonts so the first tap on "Share my skin story" doesn't wait on them. */
export const preloadStoryAssets = (): void => {
  void loadLogo();
  void loadFonts();
};

// ----------------------------------------------------------------- drawing

type Ctx = CanvasRenderingContext2D;

const M = 88; // side margin
const CW = STORY_WIDTH - M * 2;
const INK = "#0c0c0f";
const TEXT = "#fafafa";
const MUTED = "rgba(250,250,250,0.68)";
const HAIRLINE = "rgba(250,250,250,0.16)";

const brandGradient = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  BRAND_STOPS.forEach((c, i) => g.addColorStop(i / (BRAND_STOPS.length - 1), c));
  return g;
};

const setFont = (ctx: Ctx, weight: number, size: number, heading = false) => {
  ctx.font = `${weight} ${size}px ${heading ? FONT_HEADING : FONT_BODY}`;
};

const measureTracked = (ctx: Ctx, text: string, tracking: number) =>
  Array.from(text).reduce((w, ch) => w + ctx.measureText(ch).width + tracking, 0) - tracking;

const drawTracked = (ctx: Ctx, text: string, x: number, y: number, tracking: number) => {
  let cx = x;
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
};

const roundRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const label = (ctx: Ctx, text: string, y: number) => {
  setFont(ctx, 600, 24);
  ctx.fillStyle = MUTED;
  drawTracked(ctx, text, M, y, 5);
};

const drawBackground = (ctx: Ctx) => {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  const glow = (cx: number, cy: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(12,12,15,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  };
  glow(980, 120, 760, "rgba(168,85,247,0.26)");
  glow(80, 1020, 720, "rgba(34,197,94,0.12)");
  glow(900, 1800, 700, "rgba(59,130,246,0.16)");
};

const drawHeader = async (ctx: Ctx, badge: string) => {
  const logo = await loadLogo();
  const logoH = 66;
  if (logo) {
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    ctx.drawImage(logo, M, 92, logoW, logoH);
  } else {
    ctx.fillStyle = TEXT;
    setFont(ctx, 800, 52, true);
    ctx.textBaseline = "alphabetic";
    ctx.fillText("SkinLabs®", M, 145);
  }

  setFont(ctx, 600, 22);
  const padX = 24;
  const textW = measureTracked(ctx, badge, 3);
  const pillW = textW + padX * 2;
  const pillX = STORY_WIDTH - M - pillW;
  roundRect(ctx, pillX, 106, pillW, 52, 26);
  ctx.fillStyle = "rgba(250,250,250,0.06)";
  ctx.fill();
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  drawTracked(ctx, badge, pillX + padX, 140, 3);

  ctx.fillStyle = brandGradient(ctx, M, 0, CW, 0);
  ctx.fillRect(M, 204, CW, 4);
};

/** Returns the y just below the drawn block. */
const drawTitle = (ctx: Ctx, story: SanitisedStory): number => {
  setFont(ctx, 700, 30, true);
  ctx.fillStyle = brandGradient(ctx, M, 0, 420, 0);
  drawTracked(ctx, "MY SKIN STORY", M, 292, 8);
  setFont(ctx, 500, 28);
  ctx.fillStyle = MUTED;
  drawTracked(ctx, story.dateLabel, M, 340, 4);
  return 340;
};

const drawProfile = (ctx: Ctx, story: SanitisedStory, top: number): number => {
  label(ctx, "PRIMARY PROFILE", top);
  // Fit the skin type to the column: start big, shrink until it fits.
  let size = 168;
  const fits = () => {
    setFont(ctx, 800, size, true);
    return ctx.measureText(story.skinType).width <= CW;
  };
  while (size > 72 && !fits()) size -= 4;
  setFont(ctx, 800, size, true);
  const baseline = top + 24 + size * 0.95;
  const text = fitLine(story.skinType, CW, (t) => ctx.measureText(t).width);
  ctx.fillStyle = brandGradient(ctx, M, baseline - size, CW, size);
  ctx.fillText(text, M, baseline);
  let bottom = baseline;
  if (story.secondary) {
    setFont(ctx, 500, 40);
    ctx.fillStyle = TEXT;
    ctx.fillText(fitLine(story.secondary, CW, (t) => ctx.measureText(t).width), M, baseline + 64);
    bottom = baseline + 64;
  }
  return bottom;
};

const drawTone = (ctx: Ctx, tone: { level: number; hex: string }, top: number): number => {
  const r = 44;
  const cx = M + r;
  const cy = top + r;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(250,250,250,0.9)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = tone.hex;
  ctx.fill();
  setFont(ctx, 700, 46, true);
  ctx.fillStyle = TEXT;
  ctx.fillText(`MST ${tone.level}`, M + r * 2 + 36, cy + 2);
  setFont(ctx, 400, 28);
  ctx.fillStyle = MUTED;
  ctx.fillText("Self-reported skin tone", M + r * 2 + 36, cy + 42);
  return top + r * 2 + 4;
};

const drawConcerns = (ctx: Ctx, concerns: string[], top: number): number => {
  label(ctx, "CORE CONCERNS", top);
  setFont(ctx, 600, 32);
  const h = 76;
  const gap = 18;
  const padX = 34;
  let x = M;
  let y = top + 36;
  for (const concern of concerns) {
    const text = fitLine(concern, CW - padX * 2, (t) => ctx.measureText(t).width);
    const w = ctx.measureText(text).width + padX * 2;
    if (x + w > M + CW && x > M) {
      x = M;
      y += h + gap;
    }
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = "rgba(250,250,250,0.07)";
    ctx.fill();
    ctx.strokeStyle = "rgba(250,250,250,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = TEXT;
    ctx.fillText(text, x + padX, y + h / 2 + 11);
    x += w + gap;
  }
  return y + h;
};

const drawActives = (ctx: Ctx, items: string[], top: number): number => {
  label(ctx, "TARGETED ACTIVES", top);
  let y = top + 40;
  for (const item of items) {
    ctx.fillStyle = brandGradient(ctx, M, y, 8, 52);
    roundRect(ctx, M, y, 8, 52, 4);
    ctx.fill();
    setFont(ctx, 700, 44, true);
    ctx.fillStyle = TEXT;
    ctx.fillText(fitLine(item, CW - 40, (t) => ctx.measureText(t).width), M + 32, y + 40);
    y += 76;
  }
  return y - 24;
};

const drawRoutine = (ctx: Ctx, routine: { am: string | null; pm: string | null }, top: number): number => {
  label(ctx, "ROUTINE CUE", top);
  const cards = [
    { tag: "AM", text: routine.am },
    { tag: "PM", text: routine.pm },
  ].filter((c): c is { tag: string; text: string } => Boolean(c.text));
  const gap = 24;
  const w = cards.length === 1 ? CW : (CW - gap) / 2;
  const h = 150;
  const y = top + 36;
  cards.forEach((card, i) => {
    const x = M + i * (w + gap);
    roundRect(ctx, x, y, w, h, 28);
    ctx.fillStyle = "rgba(250,250,250,0.06)";
    ctx.fill();
    ctx.strokeStyle = HAIRLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    setFont(ctx, 700, 24);
    ctx.fillStyle = brandGradient(ctx, x, y, 120, 0);
    drawTracked(ctx, card.tag, x + 28, y + 46, 5);
    setFont(ctx, 600, 28);
    ctx.fillStyle = TEXT;
    wrapText(card.text, w - 56, (t) => ctx.measureText(t).width, 2).forEach((line, li) => {
      ctx.fillText(line, x + 28, y + 90 + li * 36);
    });
  });
  return y + h;
};

const drawFooter = (ctx: Ctx, hasTone: boolean) => {
  const measure = (t: string) => ctx.measureText(t).width;
  ctx.fillStyle = brandGradient(ctx, M, 0, CW, 0);
  ctx.fillRect(M, 1660, CW, 4);

  setFont(ctx, 600, 32);
  ctx.fillStyle = TEXT;
  const lines = wrapText(STORY_CTA, CW, measure, 2);
  lines.forEach((line, i) => ctx.fillText(line, M, 1722 + i * 44));

  const urlY = 1722 + (lines.length - 1) * 44 + 58;
  setFont(ctx, 700, 40, true);
  ctx.fillStyle = brandGradient(ctx, M, urlY - 40, 560, 0);
  ctx.fillText(STORY_FOOTER_URL, M, urlY);

  setFont(ctx, 400, 21);
  ctx.fillStyle = "rgba(250,250,250,0.55)";
  wrapText(hasTone ? STORY_DISCLAIMER + STORY_MST_NOTE : STORY_DISCLAIMER, CW, measure, 2).forEach((line, i) => ctx.fillText(line, M, urlY + 44 + i * 28));
};

/** Reads width/height from a PNG's IHDR chunk. */
export const readPngSize = async (blob: Blob): Promise<{ width: number; height: number } | null> => {
  const head = new DataView(await blob.slice(0, 24).arrayBuffer());
  if (head.byteLength < 24 || head.getUint32(0) !== 0x89504e47) return null;
  return { width: head.getUint32(16), height: head.getUint32(20) };
};

/** Paints the card onto a fresh 1080 × 1920 canvas. Exported for tests and previews. */
export const renderMySkinStoryCanvas = async (data: MySkinStoryData): Promise<HTMLCanvasElement> => {
  const story = sanitiseStoryData(data);
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  drawBackground(ctx);
  await drawHeader(ctx, story.badge);
  drawTitle(ctx, story);

  let y = drawProfile(ctx, story, 420);
  const GAP = 64;
  if (story.skinTone) y = drawTone(ctx, story.skinTone, y + 48);
  if (story.concerns.length) y = drawConcerns(ctx, story.concerns, y + GAP + 8);
  if (story.ingredients.length) y = drawActives(ctx, story.ingredients, y + GAP);
  if (story.routine.am || story.routine.pm) y = drawRoutine(ctx, story.routine, y + GAP);
  drawFooter(ctx, Boolean(story.skinTone));
  return canvas;
};

/** Generates the PNG. Throws if the exported bitmap isn't exactly 1080 × 1920. */
export const generateMySkinStory = async (data: MySkinStoryData): Promise<Blob> => {
  const canvas = await renderMySkinStoryCanvas(data);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png_export_failed");
  const size = await readPngSize(blob);
  if (size && (size.width !== STORY_WIDTH || size.height !== STORY_HEIGHT)) throw new Error("png_size_mismatch");
  return blob;
};
