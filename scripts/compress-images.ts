/**
 * Compresses raster images living in public/ — files here bypass Vite's asset
 * pipeline entirely (they're copied to dist/ verbatim), so vite-plugin-image-optimizer
 * (which only touches assets imported from src/ and processed by Rollup) never sees
 * them. Run via `bun run compress-images` — wired into `npm run build`, before
 * `vite build`, so dist/ always ships the compressed versions.
 *
 * Deliberately conservative and idempotent: only files above SIZE_THRESHOLD_BYTES are
 * considered, and a re-encode is only written back when it's genuinely smaller by a
 * meaningful margin. That means a file that's already been compressed (or is already
 * small) is a fast no-op on every subsequent run — no repeated lossy generations, no
 * wasted work on files that don't need it.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public");

const SIZE_THRESHOLD_BYTES = 150 * 1024; // skip files already this small
const MIN_SAVINGS_RATIO = 0.1; // only keep a re-encode that's at least 10% smaller

function listImagesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listImagesRecursive(full));
    } else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function compressOne(filePath: string): Promise<{ before: number; after: number } | null> {
  const before = statSync(filePath).size;
  if (before < SIZE_THRESHOLD_BYTES) return null;

  const ext = extname(filePath).toLowerCase();
  const input = readFileSync(filePath);
  const image = sharp(input, { animated: false });

  let output: Buffer;
  if (ext === ".png") {
    output = await image.png({ quality: 80, compressionLevel: 9, palette: true }).toBuffer();
  } else if (ext === ".webp") {
    output = await image.webp({ quality: 78 }).toBuffer();
  } else {
    output = await image.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  }

  const after = output.length;
  if (after >= before * (1 - MIN_SAVINGS_RATIO)) return null;

  writeFileSync(filePath, output);
  return { before, after };
}

async function main() {
  const files = listImagesRecursive(publicDir);
  let compressed = 0;
  let savedBytes = 0;

  for (const file of files) {
    try {
      const result = await compressOne(file);
      if (result) {
        compressed += 1;
        savedBytes += result.before - result.after;
        console.log(
          `compress-images: ${file.replace(root + "/", "")} ${(result.before / 1024).toFixed(0)}KB -> ${(result.after / 1024).toFixed(0)}KB`,
        );
      }
    } catch (err) {
      console.warn(`compress-images: failed on ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    `compress-images: done — ${compressed}/${files.length} file(s) re-encoded, ${(savedBytes / 1024 / 1024).toFixed(2)}MB saved.`,
  );
}

main().catch((err) => {
  console.warn("compress-images: skipped entirely due to an unexpected error:", err);
  process.exit(0);
});
