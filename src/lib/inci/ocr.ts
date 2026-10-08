/**
 * On-device text reading for a packaging photo. Uses the browser's built-in text detector (Shape Detection API, e.g. Chrome
 * on Android) so the image never leaves the phone and no OCR library or model is downloaded. Where the browser has no
 * detector the caller falls back to "paste the list instead" (honest: we don't pretend to read the photo).
 */
interface TextDetectorLike {
  detect: (image: ImageBitmap) => Promise<{ rawValue: string; boundingBox?: DOMRectReadOnly }[]>;
}

export const photoReadingSupported = (): boolean =>
  typeof window !== "undefined" && "TextDetector" in window && typeof createImageBitmap === "function";

export const readTextFromPhoto = async (file: File): Promise<string> => {
  if (!photoReadingSupported()) throw new Error("unsupported");
  const Detector = (window as unknown as { TextDetector: new () => TextDetectorLike }).TextDetector;
  const bitmap = await createImageBitmap(file);
  try {
    const blocks = await new Detector().detect(bitmap);
    // Top-to-bottom, left-to-right so a wrapped ingredient list reads in order.
    return blocks
      .slice()
      .sort((a, b) => (a.boundingBox?.y ?? 0) - (b.boundingBox?.y ?? 0) || (a.boundingBox?.x ?? 0) - (b.boundingBox?.x ?? 0))
      .map((b) => b.rawValue)
      .join(" ");
  } finally {
    bitmap.close();
  }
};
