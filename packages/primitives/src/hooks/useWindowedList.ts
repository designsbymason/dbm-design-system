import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_OVERSCAN = 6;
// Used until the scrolling box has been measured (and where nothing is laid out, as in a server render): enough
// rows to fill a tall list, not a design value.
const DEFAULT_VIEWPORT_SIZE = 320;

export interface WindowedListOptions {
  /** How many items the list has. */
  count: number;
  /**
   * The height in pixels of the item at `index`. Rows are never measured, so this must be known up front, and must be
   * memoised (its identity is what the offsets are recomputed from).
   */
  getItemSize: (index: number) => number;
  /**
   * Draw every item instead of a window when `false`, with the same return shape, so a caller needn't branch.
   * @default true
   */
  enabled?: boolean;
  /**
   * Items drawn beyond each edge of the visible ones, so a quick scroll doesn't show blank space.
   * @default 6
   */
  overscan?: number;
  /**
   * The viewport height in pixels to assume until the box is measured.
   * @default 320
   */
  fallbackViewportSize?: number;
}

export interface WindowedList {
  /** Pass to the scrolling box's `ref`. The hook listens to its scrolling and watches its size. */
  containerRef: (element: HTMLElement | null) => void;
  /** Index of the first item to draw. */
  start: number;
  /** Index one past the last item to draw. */
  end: number;
  /** Pixels of space to leave above the drawn items (the heights of the ones before `start`). */
  before: number;
  /** Pixels of space to leave below the drawn items (the heights of the ones from `end` on). */
  after: number;
  /** The height of the whole list. */
  totalSize: number;
  /** The scrolling box's measured height in pixels, `0` until it has been measured. */
  viewportSize: number;
  /** Scrolls the box by the least amount that brings the item fully into view. */
  scrollToIndex: (index: number) => void;
}

/** `offsets[index]`, which always exists for an index from 0 to `count`. */
const at = (offsets: readonly number[], index: number): number => offsets[index] ?? 0;

/** The first index whose item ends below `position`, found by bisection over the running totals. */
function indexAt(offsets: readonly number[], count: number, position: number): number {
  let low = 0;
  let high = count;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (at(offsets, middle + 1) <= position) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * Works out which part of a long, vertically scrolling list of fixed-height items to draw, so a list of thousands
 * costs the same as a list of dozens. The caller draws `start` to `end`, and leaves `before` and `after` pixels of
 * space around them (padding on the box that holds them) so the scrollbar and the item positions stay true.
 *
 * Heights come from `getItemSize`, never from measuring, so items must not change height by their content. Scrolling
 * is read from a native listener and the box's size from a `ResizeObserver` where there is one.
 *
 * @example
 * ```tsx
 * const { containerRef, start, end, before, after } = useWindowedList({ count: rows.length, getItemSize });
 * return (
 *   <div ref={containerRef} style={{ overflowY: "auto", maxBlockSize: 320 }}>
 *     <div style={{ paddingBlockStart: before, paddingBlockEnd: after }}>
 *       {rows.slice(start, end).map(renderRow)}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useWindowedList({
  count,
  getItemSize,
  enabled = true,
  overscan = DEFAULT_OVERSCAN,
  fallbackViewportSize = DEFAULT_VIEWPORT_SIZE,
}: WindowedListOptions): WindowedList {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredSize, setMeasuredSize] = useState(0);

  const containerRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    setElement(node);
  }, []);

  // Running totals: offsets[i] is where item i starts, offsets[count] the height of the whole list.
  const offsets = useMemo(() => {
    const totals = new Array<number>(count + 1);
    totals[0] = 0;
    for (let index = 0; index < count; index += 1) totals[index + 1] = at(totals, index) + getItemSize(index);
    return totals;
  }, [count, getItemSize]);

  useEffect(() => {
    if (!element || !enabled) return undefined;
    const read = () => {
      setScrollTop(element.scrollTop);
      setMeasuredSize(element.clientHeight);
    };
    read();
    element.addEventListener("scroll", read, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(read);
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", read);
      observer?.disconnect();
    };
  }, [element, enabled]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const box = elementRef.current;
      if (!box || index < 0 || index >= count) return;
      const top = at(offsets, index);
      const bottom = at(offsets, index + 1);
      const size = box.clientHeight || fallbackViewportSize;
      let next = box.scrollTop;
      if (top < next) next = top;
      else if (bottom > next + size) next = bottom - size;
      if (next === box.scrollTop) return;
      box.scrollTop = next;
      setScrollTop(next);
    },
    [count, offsets, fallbackViewportSize],
  );

  if (!enabled || count === 0) {
    return {
      containerRef,
      start: 0,
      end: count,
      before: 0,
      after: 0,
      totalSize: at(offsets, count),
      viewportSize: measuredSize,
      scrollToIndex,
    };
  }

  const viewport = measuredSize || fallbackViewportSize;
  const first = indexAt(offsets, count, scrollTop);
  const last = indexAt(offsets, count, scrollTop + viewport);
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, last + 1 + overscan);

  return {
    containerRef,
    start,
    end,
    before: at(offsets, start),
    after: at(offsets, count) - at(offsets, end),
    totalSize: at(offsets, count),
    viewportSize: measuredSize,
    scrollToIndex,
  };
}
