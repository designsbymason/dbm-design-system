import { describe, expect, it } from "vitest";
import { getPaginationRange, type PaginationRangeItem } from "./paginationRange";

const range = (page: number, pageCount: number, siblingCount = 1, boundaryCount = 1) =>
  getPaginationRange({ page, pageCount, siblingCount, boundaryCount });

const show = (items: PaginationRangeItem[]) =>
  items.map((item) => (item === "ellipsis-start" || item === "ellipsis-end" ? "…" : String(item))).join(" ");

describe("getPaginationRange", () => {
  it("shows every page when they all fit", () => {
    expect(show(range(1, 1))).toBe("1");
    expect(show(range(3, 5))).toBe("1 2 3 4 5");
    expect(show(range(4, 7))).toBe("1 2 3 4 5 6 7"); // 7 slots at the defaults
  });

  it("shapes the row near the start, in the middle, and near the end", () => {
    expect(show(range(1, 20))).toBe("1 2 3 4 5 … 20");
    expect(show(range(4, 20))).toBe("1 2 3 4 5 … 20");
    expect(show(range(5, 20))).toBe("1 … 4 5 6 … 20");
    expect(show(range(10, 20))).toBe("1 … 9 10 11 … 20");
    expect(show(range(16, 20))).toBe("1 … 15 16 17 … 20");
    expect(show(range(17, 20))).toBe("1 … 16 17 18 19 20");
    expect(show(range(20, 20))).toBe("1 … 16 17 18 19 20");
  });

  it("respects siblingCount and boundaryCount", () => {
    expect(show(range(10, 30, 2, 1))).toBe("1 … 8 9 10 11 12 … 30");
    expect(show(range(10, 30, 0, 1))).toBe("1 … 10 … 30");
    expect(show(range(10, 30, 1, 2))).toBe("1 2 … 9 10 11 … 29 30");
    expect(show(range(1, 30, 1, 2))).toBe("1 2 3 4 5 6 … 29 30");
    expect(show(range(10, 30, 1, 0))).toBe("… 9 10 11 …");
  });

  // Exhaustive: every combination, every page — the row keeps its shape.
  describe.each([
    [1, 1],
    [0, 1],
    [1, 0],
    [2, 1],
    [1, 2],
    [2, 2],
  ])("siblingCount %i, boundaryCount %i", (siblingCount, boundaryCount) => {
    const slots = 2 * boundaryCount + 2 * siblingCount + 3;
    for (const pageCount of [1, 2, slots - 1, slots, slots + 1, slots + 2, 25, 100]) {
      it(`keeps a constant, ordered, gap-correct row for ${pageCount} pages`, () => {
        for (let page = 1; page <= pageCount; page += 1) {
          const items = range(page, pageCount, siblingCount, boundaryCount);
          const label = `page ${page} of ${pageCount}`;

          // The same number of slots on every page (or all the pages, when few).
          expect(items.length, label).toBe(Math.min(pageCount, slots));
          // The current page, the first, and the last are always shown (unless boundary 0).
          expect(items, label).toContain(page);
          if (boundaryCount > 0) {
            expect(items, label).toContain(1);
            expect(items, label).toContain(pageCount);
          }
          // Pages are in order, without repeats, and every one is a real page.
          const pages = items.filter((item): item is number => typeof item === "number");
          expect(pages, label).toEqual([...new Set(pages)].sort((a, b) => a - b));
          expect(pages.every((n) => n >= 1 && n <= pageCount), label).toBe(true);
          // Every gap stands in for at least two pages, and is between two shown pages.
          items.forEach((item, index) => {
            if (item !== "ellipsis-start" && item !== "ellipsis-end") return;
            const before = pages.filter((n) => items.indexOf(n) < index).at(-1) ?? 0;
            const after = pages.find((n) => items.indexOf(n) > index) ?? pageCount + 1;
            expect(after - before - 1, `${label}, gap at ${index}`).toBeGreaterThanOrEqual(2);
          });
          // At most one gap of each kind.
          expect(items.filter((item) => item === "ellipsis-start").length, label).toBeLessThanOrEqual(1);
          expect(items.filter((item) => item === "ellipsis-end").length, label).toBeLessThanOrEqual(1);
        }
      });
    }
  });
});
