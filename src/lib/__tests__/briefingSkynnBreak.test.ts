import { describe, expect, test } from "bun:test";
import { findSkynnCtaSlot, splitForSkynnCta } from "../briefingSkynnBreak";

const p = (n: number) => `Paragraph ${n} of prose about South African skin.`;

describe("splitForSkynnCta", () => {
  test("splits after the 2nd prose paragraph following a heading", () => {
    const seg = `## One\n\n${p(1)}\n\n${p(2)}\n\n${p(3)}\n\n## Two\n\n${p(4)}`;
    const r = splitForSkynnCta(seg)!;
    expect(r[0].endsWith(p(2))).toBe(true);
    expect(r[1].startsWith(p(3))).toBe(true);
    expect(`${r[0]}\n\n${r[1]}`).toBe(seg);
  });

  test("never before the first heading or the 2nd paragraph", () => {
    expect(splitForSkynnCta(`${p(1)}\n\n${p(2)}\n\n${p(3)}`)).toBeNull();
    expect(splitForSkynnCta(`## One\n\n${p(1)}\n\n## Two\n\n${p(2)}`)).toBeNull();
  });

  test("skips lists, images and never lands inside them", () => {
    const seg = `## One\n\n${p(1)}\n\n- a\n- b\n\n![x](https://x.test/a.jpg)\n_Photo: A on Pexels_\n\n${p(2)}\n\n${p(3)}`;
    const r = splitForSkynnCta(seg)!;
    expect(r[0].endsWith(p(2))).toBe(true);
  });

  test("needs prose after the break, and ignores the FAQ", () => {
    expect(splitForSkynnCta(`## One\n\n${p(1)}\n\n${p(2)}`)).toBeNull();
    expect(splitForSkynnCta(`## FAQ\n\n${p(1)}\n\n${p(2)}\n\n${p(3)}`)).toBeNull();
  });
});

describe("findSkynnCtaSlot", () => {
  test("uses the first part that qualifies", () => {
    const parts = [`## A\n\n${p(1)}`, `## B\n\n${p(2)}\n\n${p(3)}\n\n${p(4)}`];
    expect(findSkynnCtaSlot(parts)?.index).toBe(1);
    expect(findSkynnCtaSlot([`## A\n\n${p(1)}`])).toBeNull();
  });
});
