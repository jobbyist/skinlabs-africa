/**
 * Reading an ingredient list from a packaging photo, entirely on the device (the image is never uploaded).
 *
 *  1. The browser's built-in text detector (Shape Detection API, Chrome on Android) when it exists: instant, no download.
 *  2. Otherwise tesseract.js (WebAssembly OCR) for every other browser. The library chunk, the worker, the WASM core and the
 *     English model are all SELF-HOSTED under /tesseract (public/tesseract), so no third-party CDN ever sees the visit, and
 *     they are only fetched the first time someone taps "Read from a photo".
 */
interface TextDetectorLike {
  detect: (image: ImageBitmap) => Promise<{ rawValue: string; boundingBox?: DOMRectReadOnly }[]>;
}

export const TESSERACT_BASE = "/tesseract";
export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
/** Longest side after downscaling: keeps label text legible while keeping OCR fast on phones. */
export const OCR_MAX_SIDE = 1800;

export const hasNativeTextDetector = (): boolean => typeof window !== "undefined" && "TextDetector" in window && typeof createImageBitmap === "function";

/** Any modern browser can decode an image and run WebAssembly; that is all the fallback needs. */
export const photoReadingSupported = (): boolean =>
  typeof window !== "undefined" && typeof createImageBitmap === "function" && typeof WebAssembly === "object" && typeof Worker !== "undefined";

/** Pure: target size that fits `maxSide`, never upscaling. */
export const fitWithin = (width: number, height: number, maxSide = OCR_MAX_SIDE): { width: number; height: number } => {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

export type OcrProgress = (status: string, fraction: number) => void;

const readWithNative = async (bitmap: ImageBitmap): Promise<string> => {
  const Detector = (window as unknown as { TextDetector: new () => TextDetectorLike }).TextDetector;
  const blocks = await new Detector().detect(bitmap);
  return blocks
    .slice()
    .sort((a, b) => (a.boundingBox?.y ?? 0) - (b.boundingBox?.y ?? 0) || (a.boundingBox?.x ?? 0) - (b.boundingBox?.x ?? 0))
    .map((b) => b.rawValue)
    .join(" ");
};

/** Downscale to a canvas (greyscale + mild contrast boost helps OCR on glossy packs). */
const toCanvas = (bitmap: ImageBitmap): HTMLCanvasElement => {
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.filter = "grayscale(1) contrast(1.25)";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
};

const readWithTesseract = async (canvas: HTMLCanvasElement, onProgress?: OcrProgress): Promise<string> => {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: `${TESSERACT_BASE}/worker.min.js`,
    corePath: `${TESSERACT_BASE}/core`,
    langPath: `${TESSERACT_BASE}/lang`,
    gzip: false,
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => onProgress?.(m.status, m.progress),
  });
  try {
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

/** Reads text from a photo. Throws "unsupported" / "too_large" / "ocr_failed" for the caller to turn into a friendly message. */
export const readTextFromPhoto = async (file: File, onProgress?: OcrProgress): Promise<string> => {
  if (!photoReadingSupported()) throw new Error("unsupported");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("too_large");
  const bitmap = await createImageBitmap(file);
  try {
    if (hasNativeTextDetector()) {
      try {
        const text = await readWithNative(bitmap);
        if (text.trim()) return text;
      } catch {
        /* fall through to the OCR library */
      }
    }
    return await readWithTesseract(toCanvas(bitmap), onProgress);
  } catch (error) {
    if (error instanceof Error && (error.message === "unsupported" || error.message === "too_large")) throw error;
    throw new Error("ocr_failed");
  } finally {
    bitmap.close();
  }
};

/** Label text arrives with line breaks mid-ingredient and stray OCR punctuation; normalise before parsing. */
export const cleanOcrText = (raw: string): string =>
  raw
    .replace(/[|]/g, "I")
    .replace(/\r/g, "")
    .replace(/-\n(?=[a-z])/g, "") // hyphenated line wraps: "Hyaluro-\nnate"
    .replace(/\n+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
