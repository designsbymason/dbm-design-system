/** How many pages `total` rows make at `pageSize` a page: always at least one, so an empty table still has a page 1. */
export function pageCountOf(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(pageSize) || pageSize < 1) return 1;
  return Math.max(1, Math.ceil(total / Math.floor(pageSize)));
}

/** `page` held to the pages there are (1-based); anything that isn't a whole number reads as the first. */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.floor(page)), Math.max(1, pageCount));
}

/** The 1-based, inclusive range of rows a page shows, and how many it shows; `first` and `last` are 0 for an empty table. */
export function rangeOf(page: number, pageSize: number, total: number): { first: number; last: number; shown: number } {
  if (total <= 0) return { first: 0, last: 0, shown: 0 };
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return { first, last, shown: Math.max(0, last - first + 1) };
}
