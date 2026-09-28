/**
 * Daily Skinny Briefings pipeline entrypoint.
 *
 * Generates 1 full-length briefing daily at 06:00 SAST (CAP=1).
 * Hardened QA: SEO heading hierarchy, unique Unsplash/Pexels covers,
 * seo_title/seo_description bounds, ?backfill=N support.
 *
 * Runtime source is gzip+base64 in bs.b64.{1,2} (avoids GitHub path size
 * limits during automated commits). Assembler inflates, rewrites shared
 * pipeline imports to immutable raw URLs, and runs Deno.serve.
 */
import "./index.assembler.ts";
