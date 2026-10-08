/**
 * Byte-level image helpers for the Community uploads (pure, unit tested in communityImage.test.ts).
 * They let a JPEG that is already smaller than any lossless re-encode be uploaded as-is, with its privacy-sensitive
 * metadata (EXIF GPS, camera serials, XMP, IPTC) removed, instead of being inflated by a lossless re-encode.
 */

export type ImageKind = "jpeg" | "png" | "webp" | "gif" | null;

export const sniffImage = (b: Uint8Array): ImageKind => {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  if (b.length >= 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "gif";
  return null;
};

/** Logical screen size of a GIF (little-endian, bytes 6-9). */
export const gifSize = (b: Uint8Array): { width: number; height: number } | null =>
  sniffImage(b) === "gif" && b.length >= 10 ? { width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8) } : null;

interface Segment {
  marker: number;
  start: number; // index of the 0xFF byte
  end: number; // exclusive
}

/** Walks the JPEG marker segments up to the start of scan. Returns null for anything that isn't a well-formed JPEG header. */
const segments = (b: Uint8Array): Segment[] | null => {
  if (sniffImage(b) !== "jpeg") return null;
  const out: Segment[] = [];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xda) {
      out.push({ marker, start: i, end: b.length });
      return out; // entropy-coded data follows; nothing after it is a header segment
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      out.push({ marker, start: i, end: i + 2 });
      i += 2;
      continue;
    }
    const length = (b[i + 2] << 8) | b[i + 3];
    if (length < 2 || i + 2 + length > b.length) return null;
    out.push({ marker, start: i, end: i + 2 + length });
    i += 2 + length;
  }
  return null;
};

/** Pixel size from the frame header (SOF0-SOF15 except DHT/JPG/DAC). */
export const jpegSize = (b: Uint8Array): { width: number; height: number } | null => {
  const segs = segments(b);
  if (!segs) return null;
  for (const s of segs) {
    if (s.marker >= 0xc0 && s.marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(s.marker)) {
      return { height: (b[s.start + 5] << 8) | b[s.start + 6], width: (b[s.start + 7] << 8) | b[s.start + 8] };
    }
  }
  return null;
};

/** EXIF orientation (1-8) from an APP1 "Exif" segment; 1 when there is none. null when the JPEG is malformed. */
export const jpegOrientation = (b: Uint8Array): number | null => {
  const segs = segments(b);
  if (!segs) return null;
  for (const s of segs) {
    if (s.marker !== 0xe1) continue;
    const p = s.start + 4;
    const isExif = b[p] === 0x45 && b[p + 1] === 0x78 && b[p + 2] === 0x69 && b[p + 3] === 0x66 && b[p + 4] === 0 && b[p + 5] === 0;
    if (!isExif) continue;
    const t = p + 6; // TIFF header
    const little = b[t] === 0x49;
    const u16 = (o: number) => (little ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
    const u32 = (o: number) => (little ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
    const ifd = t + u32(t + 4);
    if (ifd + 2 > s.end) return 1;
    const count = u16(ifd);
    for (let n = 0; n < count; n++) {
      const entry = ifd + 2 + n * 12;
      if (entry + 12 > s.end) break;
      if (u16(entry) === 0x0112) {
        const v = u16(entry + 8);
        return v >= 1 && v <= 8 ? v : 1;
      }
    }
    return 1;
  }
  return 1;
};

/**
 * Removes EXIF/XMP (APP1), IPTC/Photoshop (APP13) and comment segments. APP0 (JFIF), APP2 (ICC colour profile) and every
 * image-data segment are kept byte-for-byte, so the pixels are untouched. Only call this when the orientation is 1
 * (otherwise dropping the tag would rotate the picture). Returns null for a malformed file.
 */
export const stripJpegMetadata = (b: Uint8Array): Uint8Array | null => {
  const segs = segments(b);
  if (!segs) return null;
  const drop = new Set([0xe1, 0xed, 0xfe]);
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  for (const s of segs) if (!drop.has(s.marker)) parts.push(b.subarray(s.start, s.end));
  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

export interface Candidate {
  kind: "original" | "webp" | "png";
  bytes: number;
}

/** The smallest candidate wins; ties go to the original (no re-encode). */
export const pickSmallest = <T extends Candidate>(candidates: readonly T[]): T | null => {
  let best: T | null = null;
  for (const c of candidates) {
    if (!best || c.bytes < best.bytes || (c.bytes === best.bytes && c.kind === "original")) best = c;
  }
  return best;
};

/** Fit inside a square of `max` pixels, never upscaling. */
export const fitWithin = (w: number, h: number, max: number): { width: number; height: number } => {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
};
