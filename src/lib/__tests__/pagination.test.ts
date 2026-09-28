import { describe, expect, test } from "bun:test";
import { getPageWindow } from "../pagination";

describe("getPageWindow", () => {
  test("short lists show every page", () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  test("middle page truncates both sides", () => {
    expect(getPageWindow(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
    expect(getPageWindow(10, 20, 0)).toEqual([1, "ellipsis", 10, "ellipsis", 20]);
  });
  test("near the ends the width stays constant", () => {
    expect(getPageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
    expect(getPageWindow(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
    expect(getPageWindow(1, 20, 0)).toEqual([1, 2, 3, "ellipsis", 20]);
  });
  test("never longer than 2*siblings+5 and never an ellipsis for one page", () => {
    for (const siblings of [0, 1]) {
      for (let total = 1; total <= 40; total++) {
        for (let page = 1; page <= total; page++) {
          const w = getPageWindow(page, total, siblings);
          expect(w.length).toBeLessThanOrEqual(2 * siblings + 5);
          expect(w).toContain(page);
          expect(w[0]).toBe(1);
          expect(w[w.length - 1]).toBe(total);
          const nums = w.filter((t): t is number => t !== "ellipsis");
          for (let i = 1; i < w.length - 1; i++) {
            if (w[i] === "ellipsis") expect((w[i + 1] as number) - (w[i - 1] as number)).toBeGreaterThan(2);
          }
          expect([...nums].sort((a, b) => a - b)).toEqual(nums);
        }
      }
    }
  });
  test("out-of-range page is clamped", () => {
    expect(getPageWindow(99, 3)).toEqual([1, 2, 3]);
    expect(getPageWindow(0, 0)).toEqual([]);
  });
});
