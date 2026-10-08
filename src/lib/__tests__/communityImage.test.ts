import { describe, expect, test } from "bun:test";
import { fitWithin, gifSize, jpegOrientation, jpegSize, pickSmallest, sniffImage, stripJpegMetadata } from "../community/imageBytes";
import { EMOJI_GROUPS, insertAtSelection } from "../community/emoji";

const u8 = (...a: number[]) => new Uint8Array(a);

/** A minimal, well-formed JPEG: SOI, APP0, [APP1 Exif with GPS-ish payload], DQT-like filler, SOF0, SOS + data, EOI. */
const jpeg = (opts: { exif?: number[]; orientation?: number; w?: number; h?: number } = {}) => {
  const w = opts.w ?? 640;
  const h = opts.h ?? 480;
  const parts: number[] = [0xff, 0xd8];
  parts.push(0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00); // APP0 JFIF
  if (opts.exif || opts.orientation) {
    // Exif header + little-endian TIFF with one IFD0 entry: Orientation
    const o = opts.orientation ?? 1;
    const tiff = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, o, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff, ...(opts.exif ?? [])];
    const len = payload.length + 2;
    parts.push(0xff, 0xe1, len >> 8, len & 0xff, ...payload);
  }
  parts.push(0xff, 0xfe, 0x00, 0x05, 0x61, 0x62, 0x63); // COM
  parts.push(0xff, 0xc0, 0x00, 0x0b, 0x08, h >> 8, h & 0xff, w >> 8, w & 0xff, 0x01, 0x01, 0x11, 0x00); // SOF0
  parts.push(0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34, 0x56, 0xff, 0xd9); // SOS + data + EOI
  return new Uint8Array(parts);
};

describe("image sniffing", () => {
  test("recognises formats by their bytes, not their names", () => {
    expect(sniffImage(jpeg())).toBe("jpeg");
    expect(sniffImage(u8(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(sniffImage(u8(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0a, 0x00, 0x14, 0x00))).toBe("gif");
    expect(sniffImage(u8(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("webp");
    expect(sniffImage(u8(0x4d, 0x5a, 0x90, 0x00))).toBeNull(); // an .exe renamed to .jpg
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
  test("reads GIF and JPEG dimensions", () => {
    expect(gifSize(u8(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0a, 0x00, 0x14, 0x00))).toEqual({ width: 10, height: 20 });
    expect(jpegSize(jpeg({ w: 800, h: 600 }))).toEqual({ width: 800, height: 600 });
  });
});

describe("JPEG metadata", () => {
  test("EXIF orientation is read (1 when absent)", () => {
    expect(jpegOrientation(jpeg())).toBe(1);
    expect(jpegOrientation(jpeg({ orientation: 6 }))).toBe(6);
    expect(jpegOrientation(u8(1, 2, 3))).toBeNull();
  });
  test("stripping removes EXIF/COM but keeps JFIF, the frame header and the pixel data byte-for-byte", () => {
    const withExif = jpeg({ exif: [0x47, 0x50, 0x53, 0x21, 0x21, 0x21], orientation: 1 });
    const stripped = stripJpegMetadata(withExif)!;
    expect(stripped.length).toBeLessThan(withExif.length);
    expect(jpegOrientation(stripped)).toBe(1);
    expect(Array.from(stripped).join(",")).not.toContain("69,120,105,102"); // no "Exif"
    expect(jpegSize(stripped)).toEqual({ width: 640, height: 480 });
    // SOS onward is identical
    const tail = (b: Uint8Array) => Array.from(b.slice(b.length - 15)).join(",");
    expect(tail(stripped)).toBe(tail(withExif));
    expect(sniffImage(stripped)).toBe("jpeg");
  });
  test("a truncated or foreign file is refused rather than guessed at", () => {
    expect(stripJpegMetadata(u8(0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff))).toBeNull();
    expect(stripJpegMetadata(u8(0x89, 0x50, 0x4e, 0x47))).toBeNull();
  });
});

describe("choosing the smallest lossless output", () => {
  test("the smallest wins and an equal-size original is preferred", () => {
    expect(pickSmallest([{ kind: "webp", bytes: 900 }, { kind: "png", bytes: 1200 }, { kind: "original", bytes: 950 }])?.kind).toBe("webp");
    expect(pickSmallest([{ kind: "webp", bytes: 900 }, { kind: "original", bytes: 900 }])?.kind).toBe("original");
    expect(pickSmallest([])).toBeNull();
  });
  test("fitWithin never upscales", () => {
    expect(fitWithin(8000, 4000, 4096)).toEqual({ width: 4096, height: 2048 });
    expect(fitWithin(800, 600, 4096)).toEqual({ width: 800, height: 600 });
  });
});

describe("emoji", () => {
  test("every group has unique emoji and inserts happen at the caret", () => {
    for (const g of EMOJI_GROUPS) expect(new Set(g.emojis).size).toBe(g.emojis.length);
    expect(insertAtSelection("hello world", "✨", 5, 5, 100)).toEqual({ text: "hello✨ world", caret: 6 });
    expect(insertAtSelection("abc", "😊", null, null, 100).text).toBe("abc😊");
    expect(insertAtSelection("abc", "😊", 0, 3, 100).text).toBe("😊"); // replaces a selection
  });
  test("an insert that would exceed the limit is ignored", () => {
    expect(insertAtSelection("abcd", "😊", 4, 4, 5)).toEqual({ text: "abcd", caret: 4 });
  });
});
