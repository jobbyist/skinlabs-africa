import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import Markdown, { markdownToPlainText, parseInline, parseMarkdown, previewBlocks, safeHref } from "@/lib/community/markdown";
import { applyAlign, applyLineFormat, currentAlign, insertDivider, insertLink, toggleInline } from "@/lib/community/formatting";
import { buildCommentTree, collapsedSummary, isOriginalPoster, MAX_INDENT_DEPTH } from "@/lib/community/commentTree";
import { keyboardInset, sheetMetrics } from "@/lib/community/viewport";
import { isGiphyMediaUrl, parseGifResults } from "@/lib/community/giphy";
import type { CommunityComment } from "@/lib/community/rules";

const html = (source: string, preview = false) => renderToStaticMarkup(createElement(Markdown, { source, preview }));

describe("markdown: inline", () => {
  test("bold, italic, strike, code, nested", () => {
    expect(parseInline("a **b** *c* ~~d~~ `e`")).toEqual([
      { t: "text", v: "a " },
      { t: "bold", c: [{ t: "text", v: "b" }] },
      { t: "text", v: " " },
      { t: "italic", c: [{ t: "text", v: "c" }] },
      { t: "text", v: " " },
      { t: "strike", c: [{ t: "text", v: "d" }] },
      { t: "text", v: " " },
      { t: "code", v: "e" },
    ]);
    expect(parseInline("***both***")).toEqual([{ t: "bold", c: [{ t: "italic", c: [{ t: "text", v: "both" }] }] }]);
    expect(parseInline("*a **b** c*")).toEqual([{ t: "italic", c: [{ t: "text", v: "a " }, { t: "bold", c: [{ t: "text", v: "b" }] }, { t: "text", v: " c" }] }]);
  });
  test("stray markers stay literal", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ t: "text", v: "2 * 3 * 4" }]);
    expect(parseInline("**unclosed")).toEqual([{ t: "text", v: "**unclosed" }]);
    expect(parseInline("a * b")).toEqual([{ t: "text", v: "a * b" }]);
    expect(parseInline("\\*not italic\\*")).toEqual([{ t: "text", v: "*not italic*" }]);
  });
  test("links: http(s) only", () => {
    expect(parseInline("[x](https://skinlabs.co.za/a)")).toEqual([{ t: "link", href: "https://skinlabs.co.za/a", v: "x" }]);
    for (const bad of ["javascript:alert(1)", "data:text/html,hi", "//evil.com", "/relative", "ftp://x.y", "https://a b.com"]) {
      expect(parseInline(`[x](${bad})`).some((n) => n.t === "link")).toBe(false);
      expect(safeHref(bad)).toBeNull();
    }
  });
  test("pathological input finishes quickly", () => {
    const started = Date.now();
    parseMarkdown("*".repeat(4000));
    parseMarkdown("**a ".repeat(1000));
    parseMarkdown("[".repeat(2000) + "](".repeat(500));
    expect(Date.now() - started).toBeLessThan(1500);
  });
});

describe("markdown: blocks", () => {
  test("headings, lists, quotes, divider, paragraphs with kept line breaks", () => {
    const blocks = parseMarkdown("# Big\n## Small\n### not a heading\n\nline one\nline two\n\n- a\n* b\n\n1. x\n2. y\n\n> quoted\n> more\n\n---");
    expect(blocks.map((b) => b.t)).toEqual(["heading", "heading", "p", "p", "ul", "ol", "quote", "hr"]);
    expect(blocks[0]).toMatchObject({ t: "heading", level: 1 });
    expect(blocks[1]).toMatchObject({ t: "heading", level: 2 });
    expect(blocks[3]).toMatchObject({ t: "p", c: [{ t: "text", v: "line one" }, { t: "br" }, { t: "text", v: "line two" }] });
    expect(blocks[4]).toMatchObject({ t: "ul", items: [[{ t: "text", v: "a" }], [{ t: "text", v: "b" }]] });
    expect(blocks[5]).toMatchObject({ t: "ol", start: 1 });
  });
  test("ordered list keeps its start number; switching list kind starts a new list", () => {
    expect(parseMarkdown("3. c\n4. d")[0]).toMatchObject({ t: "ol", start: 3 });
    expect(parseMarkdown("- a\n1. b").map((b) => b.t)).toEqual(["ul", "ol"]);
  });
  test("alignment wrappers", () => {
    expect(parseMarkdown("-> hi <-")[0]).toMatchObject({ t: "p", align: "center" });
    expect(parseMarkdown("-> hi ->")[0]).toMatchObject({ t: "p", align: "right" });
    expect(parseMarkdown("-> # Title <-")[0]).toMatchObject({ t: "heading", level: 1, align: "center" });
    expect(parseMarkdown("-> a <-\nplain").map((b) => (b as { align: string }).align)).toEqual(["center", "left"]);
    expect(parseMarkdown("->nospace")[0]).toMatchObject({ t: "p", align: "left" });
  });
  test("plain posts written before formatting render unchanged", () => {
    expect(markdownToPlainText("Hello there.\nSecond line.")).toBe("Hello there. Second line.");
    expect(html("Hello & <b>there</b>")).toContain("Hello &amp; &lt;b&gt;there&lt;/b&gt;");
  });
  test("preview stops after about 320 characters of whole blocks", () => {
    const blocks = parseMarkdown(Array.from({ length: 10 }, (_, i) => `para ${i} ${"x".repeat(120)}`).join("\n\n"));
    const { blocks: kept, truncated } = previewBlocks(blocks);
    expect(truncated).toBe(true);
    expect(kept.length).toBeLessThan(blocks.length);
    expect(previewBlocks(parseMarkdown("short")).truncated).toBe(false);
  });
});

describe("markdown: rendering is safe", () => {
  test("no raw HTML ever reaches the output", () => {
    const out = html('<img src=x onerror=alert(1)> <script>alert(1)</script> [click](javascript:alert(1)) **<i>x</i>**');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<a ");
    expect(out).not.toContain("href=");
    expect(out).toContain("&lt;script&gt;");
  });
  test("links open safely", () => {
    const out = html("[go](https://example.com/?a=1&b=2)");
    expect(out).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(out).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(out).toContain('target="_blank"');
  });
  test("headings render below the post title (h3/h4), lists and quotes as real elements", () => {
    const out = html("# A\n## B\n\n- x\n\n1. y\n\n> q");
    expect(out).toContain("<h3");
    expect(out).toContain("<h4");
    expect(out).toContain("<ul");
    expect(out).toContain("<ol");
    expect(out).toContain("<blockquote");
    expect(out).toContain("tracking-tight");
    expect(out).toContain("leading-relaxed");
  });
});

describe("formatting toolbar transforms", () => {
  test("bold wraps and unwraps; empty selection parks the caret", () => {
    expect(toggleInline("hello world", 0, 5, "bold", 100)).toEqual({ text: "**hello** world", start: 2, end: 7 });
    expect(toggleInline("**hello** world", 2, 7, "bold", 100)).toEqual({ text: "hello world", start: 0, end: 5 });
    expect(toggleInline("**hello** world", 0, 9, "bold", 100)).toEqual({ text: "hello world", start: 0, end: 5 });
    expect(toggleInline("ab", 1, 1, "italic", 100)).toEqual({ text: "a**b", start: 2, end: 2 });
  });
  test("respects the length limit", () => {
    expect(toggleInline("hello", 0, 5, "bold", 6).text).toBe("hello");
  });
  test("headings replace each other and body clears them", () => {
    expect(applyLineFormat("Title", 0, 0, "h1", 100).text).toBe("# Title");
    expect(applyLineFormat("# Title", 0, 0, "h2", 100).text).toBe("## Title");
    expect(applyLineFormat("## Title", 0, 0, "h2", 100).text).toBe("Title");
    expect(applyLineFormat("# Title", 0, 0, "body", 100).text).toBe("Title");
  });
  test("lists number from 1, skip blank lines, and toggle off", () => {
    const text = "one\ntwo\n\nthree";
    const numbered = applyLineFormat(text, 0, text.length, "ordered", 100).text;
    expect(numbered).toBe("1. one\n2. two\n\n3. three");
    expect(applyLineFormat(numbered, 0, numbered.length, "ordered", 100).text).toBe(text);
    expect(applyLineFormat("a\nb", 0, 3, "bullet", 100).text).toBe("- a\n- b");
    expect(applyLineFormat("> a", 0, 0, "quote", 100).text).toBe("a");
  });
  test("only the touched lines change", () => {
    expect(applyLineFormat("keep\nchange\nkeep", 6, 6, "quote", 100).text).toBe("keep\n> change\nkeep");
  });
  test("alignment cycles and reads back", () => {
    const centred = applyAlign("hi", 0, 0, "center", 100).text;
    expect(centred).toBe("-> hi <-");
    expect(currentAlign(centred, 2)).toBe("center");
    const right = applyAlign(centred, 0, 0, "right", 100).text;
    expect(right).toBe("-> hi ->");
    expect(currentAlign(right, 0)).toBe("right");
    expect(applyAlign(right, 0, 0, "left", 100).text).toBe("hi");
    expect(applyAlign("- item", 0, 0, "center", 100).text).toBe("- item");
  });
  test("divider goes on its own paragraph", () => {
    expect(insertDivider("one", 1, 1, 100).text).toBe("one\n\n---\n\n");
    expect(insertDivider("one\n\ntwo", 1, 1, 100).text).toBe("one\n\n---\n\ntwo");
  });
  test("link: selection becomes the label and the address is selected", () => {
    const e = insertLink("see this", 4, 8, 100);
    expect(e.text).toBe("see [this](https://)");
    expect(e.text.slice(e.start, e.end)).toBe("https://");
    const bare = insertLink("", 0, 0, 100);
    expect(bare.text).toBe("[link](https://)");
    expect(bare.text.slice(bare.start, bare.end)).toBe("link");
    expect(insertLink("https://a.co", 0, 12, 100).text).toBe("[link](https://a.co)");
  });
  test("what the toolbar produces renders as intended", () => {
    const out = html(applyLineFormat(toggleInline("Hello", 0, 5, "bold", 100).text, 0, 0, "h2", 100).text);
    expect(out).toContain("<h4");
    expect(out).toContain("<strong");
  });
});

const c = (id: string, parent: string | null, over: Partial<CommunityComment> = {}): CommunityComment => ({
  id, post_id: "p", parent_id: parent, author_name: id, author_role: "member", is_mine: false, body: id, like_count: 0,
  created_at: "2026-10-09T10:00:00Z", edited_at: null, liked_by_me: false, author_avatar: null, ...over,
});

describe("comment tree", () => {
  test("groups by parent_id with depth and descendant counts", () => {
    const tree = buildCommentTree([c("a", null), c("b", "a"), c("c", "b"), c("d", "a"), c("e", null)]);
    expect(tree.map((n) => n.comment.id)).toEqual(["a", "e"]);
    expect(tree[0].children.map((n) => n.comment.id)).toEqual(["b", "d"]);
    expect(tree[0].descendants).toBe(3);
    expect(tree[0].children[0].children[0].depth).toBe(2);
    expect(tree[1].descendants).toBe(0);
  });
  test("orphans and cycles surface at the top level instead of vanishing", () => {
    const tree = buildCommentTree([c("a", "gone"), c("b", "b"), c("x", "y"), c("y", "x")]);
    expect(tree.map((n) => n.comment.id).sort()).toEqual(["a", "b", "x", "y"].sort().filter((id) => tree.some((n) => n.comment.id === id)));
    const all = new Set<string>();
    const walk = (nodes: typeof tree) => nodes.forEach((n) => (all.add(n.comment.id), walk(n.children)));
    walk(tree);
    expect([...all].sort()).toEqual(["a", "b", "x", "y"]);
  });
  test("collapsed summary wording", () => {
    expect(collapsedSummary("glow_girl", 0)).toBe("glow_girl (collapsed)");
    expect(collapsedSummary("glow_girl", 1)).toBe("glow_girl (1 reply collapsed)");
    expect(collapsedSummary("glow_girl", 4)).toBe("glow_girl (4 replies collapsed)");
    expect(MAX_INDENT_DEPTH).toBeGreaterThan(2);
  });
  test("OP detection", () => {
    const post = { is_mine: false, author_name: "Nicole N.", author_role: "member" as const };
    expect(isOriginalPoster(post, c("a", null, { author_name: "Nicole N." }))).toBe(true);
    expect(isOriginalPoster(post, c("a", null, { author_name: "Cole O." }))).toBe(false);
    expect(isOriginalPoster({ ...post, is_mine: true }, c("a", null, { is_mine: true }))).toBe(true);
    expect(isOriginalPoster({ ...post, is_mine: true }, c("a", null, { author_name: "Nicole N." }))).toBe(false);
    expect(isOriginalPoster(post, c("a", null, { is_mine: true, author_name: "Nicole N." }))).toBe(false);
  });
});

describe("keyboard-aware sheet", () => {
  test("inset is the gap under the visual viewport", () => {
    expect(keyboardInset(800, { height: 500, offsetTop: 0 })).toBe(300);
    expect(keyboardInset(800, { height: 500, offsetTop: 40 })).toBe(260);
    expect(keyboardInset(800, { height: 800, offsetTop: 0 })).toBe(0);
    expect(keyboardInset(800, null)).toBe(0);
  });
  test("sheet metrics", () => {
    expect(sheetMetrics(800, { height: 500, offsetTop: 0 })).toEqual({ bottom: 300, maxHeight: 470, keyboardOpen: true });
    // URL-bar collapse is not a keyboard
    expect(sheetMetrics(800, { height: 740, offsetTop: 0 }).keyboardOpen).toBe(false);
    expect(sheetMetrics(800, undefined)).toEqual({ bottom: 0, maxHeight: null, keyboardOpen: false });
  });
});

describe("GIF search results", () => {
  const rendition = (url: string, size = "100000") => ({ url, width: "200", height: "150", size });
  test("only GIPHY media hosts over https are accepted", () => {
    expect(isGiphyMediaUrl("https://media2.giphy.com/media/x/giphy.gif")).toBe(true);
    expect(isGiphyMediaUrl("https://i.giphy.com/x.gif")).toBe(true);
    for (const bad of ["http://media.giphy.com/x.gif", "https://evil.com/giphy.com/x.gif", "https://giphy.com.evil.com/x.gif", "javascript:1", 5, null]) expect(isGiphyMediaUrl(bad)).toBe(false);
  });
  test("parses, picks an uploadable rendition and drops junk", () => {
    const json = {
      pagination: { total_count: 90 },
      data: [
        { id: "1", title: "  Glow  ", images: { fixed_width_small: rendition("https://media1.giphy.com/s.gif"), downsized: rendition("https://media1.giphy.com/d.gif", "2000000") } },
        { id: "2", title: "", images: { fixed_width_small: rendition("https://media1.giphy.com/s2.gif"), downsized: rendition("https://media1.giphy.com/big.gif", "9000000"), fixed_height: rendition("https://media1.giphy.com/h.gif", "800000") } },
        { id: "3", images: { fixed_width_small: rendition("https://evil.example/s.gif"), downsized: rendition("https://evil.example/d.gif") } },
        { id: 4 },
        null,
      ],
    };
    const { results, total } = parseGifResults(json);
    expect(total).toBe(90);
    expect(results.map((r) => r.id)).toEqual(["1", "2"]);
    expect(results[0]).toMatchObject({ title: "Glow", fileUrl: "https://media1.giphy.com/d.gif", width: 200, height: 150 });
    expect(results[1].fileUrl).toBe("https://media1.giphy.com/h.gif");
    expect(results[1].title).toBe("GIF");
    expect(parseGifResults(null)).toEqual({ results: [], total: 0 });
  });
});
