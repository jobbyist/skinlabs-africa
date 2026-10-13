import { fitWithin, gifSize, jpegOrientation, pickSmallest, sniffImage, stripJpegMetadata, type Candidate } from "./imageBytes";

/**
 * Browser-side image preparation for Community uploads and profile pictures.
 *
 * "Lossless compression": pixels are never altered by the encoder. The picture is decoded (EXIF rotation applied), re-encoded as
 * lossless WebP and as PNG (both reproduce every pixel exactly), and the smallest of {lossless WebP, PNG, the original file
 * with its metadata stripped} is uploaded. Metadata (EXIF/GPS) never reaches storage. Animated GIFs are uploaded untouched (a
 * re-encode would drop the animation). The only non-lossless step is a safety net: a picture larger than the per-file limit
 * (3 MB posts / 1 MB avatars) or 4096 px is scaled down, and the member is told when that happened.
 */

export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const MEDIA_MAX_BYTES = 3 * 1024 * 1024; // matches the community-media bucket limit
export const AVATAR_MAX_BYTES = 1024 * 1024; // matches the avatars bucket limit
export const MEDIA_MAX_DIMENSION = 4096;
export const AVATAR_SIZE = 512;

export type PreparedExt = "webp" | "png" | "jpg" | "gif";

export interface PreparedImage {
  blob: Blob;
  ext: PreparedExt;
  contentType: string;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
  /** Plain-language summary for the UI, e.g. "Saved 58% (4.1 MB → 1.7 MB), no quality lost." */
  note: string | null;
}

export class ImageError extends Error {}

export interface PrepareOptions {
  maxBytes: number;
  maxDimension: number;
  /** Centre-crop to a square no larger than this many pixels (profile pictures). */
  square?: number;
}

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

const decode = async (blob: Blob): Promise<Decoded> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
  } catch {
    throw new ImageError("We couldn't read that image. Try a different file.");
  } finally {
    URL.revokeObjectURL(url);
  }
};

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

const draw = (d: Decoded, width: number, height: number, crop: { sx: number; sy: number; sw: number; sh: number }): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("This browser can't process images. Try another browser.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(d.source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
  return canvas;
};

/** Lossless candidates for a canvas. `quality = 1` is lossless WebP in Chromium; where WebP encoding is unsupported the browser returns PNG and we skip it. */
const losslessCandidates = async (canvas: HTMLCanvasElement): Promise<(Candidate & { blob: Blob })[]> => {
  const out: (Candidate & { blob: Blob })[] = [];
  const webp = await toBlob(canvas, "image/webp", 1);
  if (webp && webp.type === "image/webp") out.push({ kind: "webp", bytes: webp.size, blob: webp });
  const png = await toBlob(canvas, "image/png");
  if (png) out.push({ kind: "png", bytes: png.size, blob: png });
  return out;
};

const EXT = { webp: "webp", png: "png", original: "jpg" } as const;

export const prepareImage = async (file: File, opts: PrepareOptions): Promise<PreparedImage> => {
  if (file.size > MAX_INPUT_BYTES) throw new ImageError(`That file is too large (${mb(file.size)}). Choose one under ${mb(MAX_INPUT_BYTES)}.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new ImageError("That file isn't a supported image. Use JPEG, PNG, WebP or GIF.");

  // Animated GIFs: untouched (re-encoding would flatten the animation).
  if (kind === "gif" && !opts.square) {
    if (file.size > opts.maxBytes) throw new ImageError(`GIFs must be under ${mb(opts.maxBytes)} (this one is ${mb(file.size)}).`);
    const dims = gifSize(bytes) ?? { width: 1, height: 1 };
    return { blob: new Blob([bytes], { type: "image/gif" }), ext: "gif", contentType: "image/gif", width: dims.width, height: dims.height, originalBytes: file.size, bytes: file.size, note: null };
  }

  const decoded = await decode(new Blob([bytes], { type: file.type || `image/${kind}` }));
  try {
    const { width, height } = decoded;
    if (width < 1 || height < 1) throw new ImageError("We couldn't read that image. Try a different file.");
    let crop = { sx: 0, sy: 0, sw: width, sh: height };
    let target = fitWithin(width, height, opts.maxDimension);
    if (opts.square) {
      const side = Math.min(width, height);
      crop = { sx: Math.floor((width - side) / 2), sy: Math.floor((height - side) / 2), sw: side, sh: side };
      const px = Math.min(side, opts.square);
      target = { width: px, height: px };
    }
    const resizedByDimension = target.width !== decoded.width || target.height !== decoded.height;

    // The untouched original competes only when it needs no pixel change: same size, no crop, and (for JPEG) no rotation tag.
    const candidates: (Candidate & { blob: Blob })[] = [];
    if (!opts.square && !resizedByDimension) {
      if (kind === "jpeg") {
        const stripped = jpegOrientation(bytes) === 1 ? stripJpegMetadata(bytes) : null;
        if (stripped) candidates.push({ kind: "original", bytes: stripped.length, blob: new Blob([new Uint8Array(stripped)], { type: "image/jpeg" }) });
      } else if (kind === "png" || kind === "webp") {
        candidates.push({ kind: "original", bytes: file.size, blob: new Blob([bytes], { type: `image/${kind}` }) });
      }
    }

    let canvas = draw(decoded, target.width, target.height, crop);
    candidates.push(...(await losslessCandidates(canvas)));
    let best = pickSmallest(candidates);

    // Safety net: still over the limit -> scale down in steps (the one lossy step; the member is told).
    let scaled = resizedByDimension;
    let guard = 0;
    while (best && best.bytes > opts.maxBytes && Math.max(target.width, target.height) > 640 && guard++ < 8) {
      target = { width: Math.max(1, Math.round(target.width * 0.85)), height: Math.max(1, Math.round(target.height * 0.85)) };
      canvas = draw(decoded, target.width, target.height, crop);
      best = pickSmallest(await losslessCandidates(canvas));
      scaled = true;
    }
    if (!best || best.bytes > opts.maxBytes) throw new ImageError(`That picture is too detailed to fit the ${mb(opts.maxBytes)} limit. Try a smaller one.`);

    const ext = best.kind === "original" ? (kind === "jpeg" ? "jpg" : (kind as "png" | "webp")) : EXT[best.kind];
    const contentType = best.kind === "original" ? `image/${kind === "jpeg" ? "jpeg" : kind}` : best.kind === "webp" ? "image/webp" : "image/png";
    const saved = Math.round((1 - best.bytes / file.size) * 100);
    const note = scaled
      ? "Scaled down to fit the size limit."
      : saved >= 3
        ? `Optimised: ${mb(file.size)} → ${mb(best.bytes)} with no quality lost.`
        : null;
    return { blob: best.blob, ext: ext as PreparedExt, contentType, width: target.width, height: target.height, originalBytes: file.size, bytes: best.bytes, note };
  } finally {
    decoded.close();
  }
};

export const prepareCommunityImage = (file: File) => prepareImage(file, { maxBytes: MEDIA_MAX_BYTES, maxDimension: MEDIA_MAX_DIMENSION });
export const prepareAvatar = (file: File) => prepareImage(file, { maxBytes: AVATAR_MAX_BYTES, maxDimension: AVATAR_SIZE, square: AVATAR_SIZE });
