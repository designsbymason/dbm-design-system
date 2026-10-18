import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** The rows a bar leads with that scroll away (`data-scroll-away`), in order, stopping at the first that doesn't. */
function leadingRows(bar: HTMLElement): HTMLElement[] {
  const rows: HTMLElement[] = [];
  for (const child of Array.from(bar.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (!child.hasAttribute("data-scroll-away")) break;
    rows.push(child);
  }
  return rows;
}

/**
 * The combined height, in pixels, of the rows at the start of a sticky bar that are set to scroll away. The bar sticks as one box,
 * so to let those rows leave the screen while the rest stays it sticks that far above the top; this is how far. Measured from the
 * rows themselves and kept current as they resize, only once mounted, so a server render and the first client render agree (zero).
 */
export function useLeadingRowsHeight(enabled: boolean, barRef: RefObject<HTMLElement | null>, rowCount: number): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const bar = barRef.current;
    if (!enabled || bar === null) return undefined;
    const rows = leadingRows(bar);
    const measure = () => setHeight(rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0));
    measure();
    if (typeof ResizeObserver === "undefined") return () => setHeight(0);
    const observer = new ResizeObserver(measure);
    for (const row of rows) observer.observe(row);
    return () => {
      observer.disconnect();
      setHeight(0);
    };
  }, [enabled, barRef, rowCount]);

  return enabled ? height : 0;
}

/**
 * Whether the page (or `scrollContainerRef`) has scrolled past the leading rows, which is when a bar with rows that scroll away is
 * really stuck: the sticky detector reports stuck from the first pixel, while those rows are still on screen.
 */
export function useScrolledPast(
  distance: number,
  scrollContainerRef: RefObject<HTMLElement | null> | undefined,
): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (distance <= 0 || typeof window === "undefined") return undefined;
    const container = scrollContainerRef?.current ?? null;
    const target: HTMLElement | Window = container ?? window;
    const read = () => setPast((container ? container.scrollTop : window.scrollY) >= distance);
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => {
      target.removeEventListener("scroll", read);
      setPast(false);
    };
  }, [distance, scrollContainerRef]);

  return distance > 0 && past;
}
