import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

// Real browsers report sub-pixel layout values that can differ by less than a pixel between two reads of what is
// visually the same edge.
const EPSILON = 1;

/**
 * Whether the first (or last) child of a scrolling bar is not fully inside the bar's own box. Direction-agnostic within
 * its axis, so it is the same in a right-to-left bar without reading `scrollLeft`, whose sign differs across browsers in
 * that case. The same technique `Tabs` uses for its list (`useTabsOverflow`), kept local to this component rather than
 * shared, since sharing would mean changing `Tabs`.
 */
function readEdge(list: HTMLElement | null, edge: "first" | "last", axis: "inline" | "block"): boolean {
  if (!list) return false;
  const child = edge === "first" ? list.firstElementChild : list.lastElementChild;
  if (!child) return false;
  const listRect = list.getBoundingClientRect();
  const rect = child.getBoundingClientRect();
  if (axis === "block") return rect.top < listRect.top - EPSILON || rect.bottom > listRect.bottom + EPSILON;
  return rect.left < listRect.left - EPSILON || rect.right > listRect.right + EPSILON;
}

/**
 * Tracks whether the first and/or last item of a scrolling toolbar is currently out of view: what drives the edge fades
 * and the scroll buttons, which need to know *which* end has more, not only whether the bar scrolls. Built on
 * `useSyncExternalStore` so it is right on the first frame, and re-checks on scroll, on the bar's own size changing, and
 * on items being added or removed. Does nothing while `enabled` is false (a bar that isn't a scroller).
 */
export function useScrollEdges(
  listRef: RefObject<HTMLElement | null>,
  orientation: "horizontal" | "vertical",
  enabled: boolean,
): { overflowStart: boolean; overflowEnd: boolean } {
  const axis = orientation === "vertical" ? "block" : "inline";
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = listRef.current;
      if (!enabled || !list) return noop;
      const cleanups: Array<() => void> = [];

      list.addEventListener("scroll", onChange, { passive: true });
      cleanups.push(() => list.removeEventListener("scroll", onChange));

      if (typeof ResizeObserver !== "undefined") {
        const resizeObserver = new ResizeObserver(onChange);
        resizeObserver.observe(list);
        cleanups.push(() => resizeObserver.disconnect());
      }
      if (typeof MutationObserver !== "undefined") {
        const mutationObserver = new MutationObserver(onChange);
        mutationObserver.observe(list, { childList: true, subtree: true });
        cleanups.push(() => mutationObserver.disconnect());
      }
      return () => cleanups.forEach((cleanup) => cleanup());
    },
    [listRef, enabled],
  );

  const overflowStart = useSyncExternalStore(
    subscribe,
    () => enabled && readEdge(listRef.current, "first", axis),
    () => false,
  );
  const overflowEnd = useSyncExternalStore(
    subscribe,
    () => enabled && readEdge(listRef.current, "last", axis),
    () => false,
  );
  return { overflowStart, overflowEnd };
}
