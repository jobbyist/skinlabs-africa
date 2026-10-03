/**
 * Derives the PWA icon set from the existing SkinLabs® brand artwork
 * (public/pwa-512.png, the square wordmark tile) — no new artwork is created.
 *
 *   bun run scripts/generate-pwa-icons.ts
 *
 * Outputs (committed, so the build never depends on this script):
 *   public/pwa-192.png            "any" 192×192
 *   public/pwa-512.png            "any" 512×512
 *   public/pwa-maskable-512.png   "maskable" 512×512 — the tile scaled to the 80% safe zone
 *                                 over its own background colour, so circular/squircle masks
 *                                 never clip the wordmark or the BETA badge.
 *
 * (The previous pwa-192.png / pwa-512.png were both 1024×1024, which Chrome's installability
 * check rejects when the manifest declares a different size.)
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read into memory: the source is also overwritten below (sharp refuses same-file in/out).
const SOURCE = readFileSync(resolve("public/pwa-512.png"));
const OUT = (name: string) => resolve("public", name);

const meta = await sharp(SOURCE).metadata();
if (!meta.width || !meta.height) throw new Error("Unreadable source icon");

// Background colour = the tile's own corner pixel, so the maskable padding is seamless.
const { data } = await sharp(SOURCE).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
const background = { r: data[0], g: data[1], b: data[2], alpha: 1 };

const any = (size: number) => sharp(SOURCE).resize(size, size, { fit: "cover" }).png({ compressionLevel: 9 });

await any(192).toFile(OUT("pwa-192.png"));
await any(512).toFile(OUT("pwa-512.png"));

const inner = Math.round(512 * 0.8);
const innerBuffer = await sharp(SOURCE).resize(inner, inner, { fit: "cover" }).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background } })
  .composite([{ input: innerBuffer, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toFile(OUT("pwa-maskable-512.png"));

console.log("[pwa-icons] wrote pwa-192.png, pwa-512.png, pwa-maskable-512.png, background", background);
