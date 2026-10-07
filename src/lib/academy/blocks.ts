/**
 * Lesson body blocks (academy_lesson_content.body_blocks). Course content is data, never JSX: this schema is the
 * canonical shape, validated when a lesson is saved and again before publish. Text blocks are Markdown rendered with
 * react-markdown (no raw HTML). Unknown block types are rejected, which also keeps the format exportable later
 * (SCORM / cmi5 / xAPI) without guessing.
 */
import { z } from "zod";

const text = (max = 20_000) => z.string().trim().min(1).max(max);
const uuid = z.string().uuid();

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: text(200) }).strict(),
  z.object({ type: z.literal("paragraph"), text: text() }).strict(),
  z.object({ type: z.literal("list"), ordered: z.boolean().default(false), items: z.array(text(2_000)).min(1).max(50) }).strict(),
  z.object({ type: z.literal("callout"), variant: z.enum(["info", "caution"]), text: text(4_000) }).strict(),
  z.object({ type: z.literal("key_takeaways"), items: z.array(text(500)).min(1).max(10) }).strict(),
  z.object({ type: z.literal("image"), asset_id: uuid, caption: z.string().trim().max(500).optional() }).strict(),
  z.object({ type: z.literal("audio"), asset_id: uuid }).strict(),
  z.object({ type: z.literal("download"), asset_id: uuid, label: text(200) }).strict(),
  z.object({ type: z.literal("citation"), source_id: uuid }).strict(),
  z.object({ type: z.literal("divider") }).strict(),
]);

export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export const lessonBlocksSchema = z.array(lessonBlockSchema).max(300);

export type ParseBlocksResult = { ok: true; blocks: LessonBlock[] } | { ok: false; errors: string[] };

export const parseLessonBlocks = (input: unknown): ParseBlocksResult => {
  const parsed = lessonBlocksSchema.safeParse(input);
  if (parsed.success) return { ok: true, blocks: parsed.data };
  return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
};

/** Asset ids a lesson body refers to (used by the studio to keep academy_lesson_assets in step). */
export const blockAssetIds = (blocks: readonly LessonBlock[]): string[] =>
  [...new Set(blocks.flatMap((b) => ("asset_id" in b ? [b.asset_id] : [])))];

/** Plain text of a body, for the accreditation-wording scan, word counts and search. */
export const blocksToPlainText = (blocks: readonly LessonBlock[]): string =>
  blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
        case "paragraph":
        case "callout":
          return b.text;
        case "list":
        case "key_takeaways":
          return b.items.join(" ");
        case "download":
          return b.label;
        case "image":
          return b.caption ?? "";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");

/** Rough reading time in whole minutes (200 wpm), never below 1 for a non-empty body. */
export const estimateReadingMinutes = (blocks: readonly LessonBlock[]): number => {
  const words = blocksToPlainText(blocks).split(/\s+/).filter(Boolean).length;
  return words === 0 ? 0 : Math.max(1, Math.round(words / 200));
};
