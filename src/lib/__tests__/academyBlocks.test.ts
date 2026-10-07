import { describe, expect, test } from "bun:test";
import { blockAssetIds, blocksToPlainText, estimateReadingMinutes, parseLessonBlocks } from "@/lib/academy/blocks";

const ID = "6f1c0a52-3b7e-4d0e-9a55-0c1f2d3e4a5b";
const ID2 = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

describe("lesson blocks", () => {
  test("accepts every supported block type", () => {
    const r = parseLessonBlocks([
      { type: "heading", level: 2, text: "Barrier basics" },
      { type: "paragraph", text: "The skin barrier is **layered**." },
      { type: "list", items: ["a", "b"] },
      { type: "callout", variant: "caution", text: "Patch test first." },
      { type: "key_takeaways", items: ["One", "Two"] },
      { type: "image", asset_id: ID, caption: "Cross-section" },
      { type: "audio", asset_id: ID2 },
      { type: "download", asset_id: ID, label: "Worksheet" },
      { type: "citation", source_id: ID2 },
      { type: "divider" },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.blocks[2]).toEqual({ type: "list", ordered: false, items: ["a", "b"] });
  });

  test("rejects unknown types, extra keys, empty text and bad ids", () => {
    for (const bad of [
      [{ type: "html", text: "<script>x</script>" }],
      [{ type: "paragraph", text: "ok", style: "x" }],
      [{ type: "paragraph", text: "   " }],
      [{ type: "image", asset_id: "not-a-uuid" }],
      [{ type: "heading", level: 1, text: "H1 not allowed" }],
      "not an array",
    ]) {
      const r = parseLessonBlocks(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
    }
  });

  test("asset ids, plain text and reading time", () => {
    const parsed = parseLessonBlocks([
      { type: "paragraph", text: Array.from({ length: 400 }, () => "word").join(" ") },
      { type: "image", asset_id: ID },
      { type: "download", asset_id: ID, label: "PDF" },
      { type: "audio", asset_id: ID2 },
    ]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(blockAssetIds(parsed.blocks).sort()).toEqual([ID, ID2].sort());
    expect(blocksToPlainText(parsed.blocks)).toContain("PDF");
    expect(estimateReadingMinutes(parsed.blocks)).toBe(2);
    expect(estimateReadingMinutes([])).toBe(0);
  });
});
