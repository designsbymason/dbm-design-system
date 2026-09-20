/** One slot in the row of page numbers: a page, or a gap standing in for pages left out. */
export type PaginationRangeItem = number | "ellipsis-start" | "ellipsis-end";

interface PaginationRangeOptions {
  /** The current page, 1-based, already within `1..pageCount`. */
  page: number;
  pageCount: number;
  /** Pages shown either side of the current one. */
  siblingCount: number;
  /** Pages always shown at each end. */
  boundaryCount: number;
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);

/**
 * The row of slots to render: page numbers, with a gap where pages are left out.
 *
 * The row always has the same number of slots — `2 × boundary + 2 × sibling + 3`, gaps
 * included — however far the current page is from the ends, so the controls don't shift
 * sideways as you move through the pages. When there are few enough pages to fit, all of
 * them are shown. Otherwise there are three shapes: the current page is near the start (a
 * long run of pages, a gap, then the last pages), near the end (the mirror image), or in
 * the middle (first pages, a gap, the current page and its siblings, a gap, last pages).
 * A gap always stands in for at least two pages — a gap for a single page would be no
 * shorter than the page itself.
 */
export function getPaginationRange({
  page,
  pageCount,
  siblingCount,
  boundaryCount,
}: PaginationRangeOptions): PaginationRangeItem[] {
  const slots = 2 * boundaryCount + 2 * siblingCount + 3;
  if (pageCount <= slots) return range(1, pageCount);

  const edgeRun = boundaryCount + 2 * siblingCount + 2;
  const startPages = range(1, boundaryCount);
  const endPages = range(pageCount - boundaryCount + 1, pageCount);

  // Near the start: one long run from page 1, so the window never touches the first gap.
  if (page <= boundaryCount + siblingCount + 2) {
    return [...range(1, edgeRun), "ellipsis-end", ...endPages];
  }
  // Near the end: the mirror image.
  if (page >= pageCount - (boundaryCount + siblingCount + 1)) {
    return [...startPages, "ellipsis-start", ...range(pageCount - edgeRun + 1, pageCount)];
  }
  return [
    ...startPages,
    "ellipsis-start",
    ...range(page - siblingCount, page + siblingCount),
    "ellipsis-end",
    ...endPages,
  ];
}
