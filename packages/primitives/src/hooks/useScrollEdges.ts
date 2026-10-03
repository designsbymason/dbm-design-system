import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

// Real browsers report sub-pixel layout values that can differ by less than a pixel between two reads of what is
// visually the same edge.
const EPSILON = 1;

export interface UseScrollEdgesOptions {
  /**
   * A CSS selector for the items whose first and last decide each edge (`'[role="tab"]'`). Left out, the container's
   * direct children are the items.
   */
  itemSelector?: string;
  /**
   * Whether to track at all. Off, nothing is subscribed and both edges read `false` — for a container that is only
   * sometimes a scroller.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Whether the first (or last) item in a scrolling container is not fully inside the container's own box. Compared by
 * bounding rectangles, so it is direction-agnostic within its axis and works the same in a right-to-left container
 * without reading `scrollLeft`, whose sign convention differs across browsers in that case. `axis` picks which pair of
 * edges matters: `"inline"` (left/right) for a horizontal container, `"block"` (top/bottom) for a vertical one.
 */
function readEdge(
  container: HTMLElement | null,
  edge: "first" | "last",
  axis: "inline" | "block",
  itemSelector: string | undefined,
): boolean {
  if (!container) return false;
  let item: Element | null | undefined;
  if (itemSelector) {
    const items = container.querySelectorAll(itemSelector);
    item = edge === "first" ? items[0] : items[items.length - 1];
  } else {
    item = edge === "first" ? container.firstElementChild : container.lastElementChild;
  }
  if (!item) return false;
  const box = container.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  if (axis === "block") return rect.top < box.top - EPSILON || rect.bottom > box.bottom + EPSILON;
  return rect.left < box.left - EPSILON || rect.right > box.right + EPSILON;
}

/**
 * Tracks whether the first and/or last item of a scrolling container is currently out of view — what drives edge
 * fades and scroll buttons, which need to know *which* end has more, not only whether the container scrolls at all
 * (the question `useIsScrollable` answers). `orientation` picks the axis: a horizontal container's start and end are
 * its left and right edges (mirrored in right-to-left, since the comparison is of rectangles), a vertical one's its
 * top and bottom.
 *
 * Built on `useSyncExternalStore`, so it is right on the very first frame a fade or button could matter, not one
 * asynchronous tick behind an observer. Re-checks on `scroll` (the only way to learn about a position change with no
 * size change), on the container's own size changing (`ResizeObserver`), and on items being added or removed
 * (`MutationObserver`, since a `ResizeObserver` on the container reports only its own box, not its scrollable
 * content). Each observer is skipped where the environment lacks it.
 *
 * Shared by `Tabs` (its tab list) and `Toolbar` (`overflow="scroll"`), extracted once the second consumer needed the
 * same logic.
 */
export function useScrollEdges(
  containerRef: RefObject<HTMLElement | null>,
  orientation: "horizontal" | "vertical",
  { itemSelector, enabled = true }: UseScrollEdgesOptions = {},
): { overflowStart: boolean; overflowEnd: boolean } {
  const axis = orientation === "vertical" ? "block" : "inline";
  const subscribe = useCallback(
    (onChange: () => void) => {
      const container = containerRef.current;
      if (!enabled || !container) return noop;
      const cleanups: Array<() => void> = [];

      container.addEventListener("scroll", onChange, { passive: true });
      cleanups.push(() => container.removeEventListener("scroll", onChange));

      if (typeof ResizeObserver !== "undefined") {
        const resizeObserver = new ResizeObserver(onChange);
        resizeObserver.observe(container);
        cleanups.push(() => resizeObserver.disconnect());
      }
      if (typeof MutationObserver !== "undefined") {
        const mutationObserver = new MutationObserver(onChange);
        mutationObserver.observe(container, { childList: true, subtree: true });
        cleanups.push(() => mutationObserver.disconnect());
      }
      return () => cleanups.forEach((cleanup) => cleanup());
    },
    [containerRef, enabled],
  );

  // Two independent subscriptions, each returning a primitive: `getSnapshot` must return a value that is stable under
  // `Object.is` when nothing changed, which a fresh `{ overflowStart, overflowEnd }` object on every call never would.
  const overflowStart = useSyncExternalStore(
    subscribe,
    () => enabled && readEdge(containerRef.current, "first", axis, itemSelector),
    () => false,
  );
  const overflowEnd = useSyncExternalStore(
    subscribe,
    () => enabled && readEdge(containerRef.current, "last", axis, itemSelector),
    () => false,
  );
  return { overflowStart, overflowEnd };
}
