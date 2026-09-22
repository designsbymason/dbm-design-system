import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

// A fraction of a pixel of rounding slack — real browsers report sub-pixel
// layout values that can differ by less than 1px between two reads of what
// is visually the same edge.
const EPSILON = 1;

/**
 * Whether the first (or last) tab in a horizontal list is not fully inside the
 * list's own box — direction-agnostic, so it works the same in a right-to-left
 * list without reading `scrollLeft`, whose sign convention differs across
 * browsers in that case (the same reason `revealTab` in `Tabs.tsx` compares
 * bounding rectangles instead).
 */
function readOverflow(list: HTMLElement | null, edge: "first" | "last"): boolean {
  if (!list) return false;
  const tabs = list.querySelectorAll<HTMLElement>('[role="tab"]');
  const tab = edge === "first" ? tabs[0] : tabs[tabs.length - 1];
  if (!tab) return false;
  const listRect = list.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  return tabRect.left < listRect.left - EPSILON || tabRect.right > listRect.right + EPSILON;
}

/**
 * Tracks whether the first and/or last tab of a horizontal, scrolling list is
 * currently out of view — what drives the edge fades and the scroll buttons,
 * which need to know *which* edge, not just whether the list scrolls at all
 * (unlike `Table`'s own `useScrollableRegion`, the question this hook is
 * otherwise modelled on).
 *
 * Built on `useSyncExternalStore`, the same standing pattern
 * (`guidelines/adr/0019`): correct on the very first frame a fade or button
 * could matter, not one async tick behind a `ResizeObserver` callback.
 * Re-checks on scroll (a real `scroll` listener — cheap, and the only way to
 * learn about a position change with no size change), on the list's own size
 * changing (`ResizeObserver`), and on tabs being added or removed
 * (`MutationObserver`, since a `ResizeObserver` on the list only reports the
 * list's *own* box, not its scrollable content — adding a tab changes
 * `scrollWidth` without changing the list's own rendered size).
 */
export function useTabsOverflow(listRef: RefObject<HTMLDivElement | null>): {
  overflowStart: boolean;
  overflowEnd: boolean;
} {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = listRef.current;
      if (!list) return noop;
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
    [listRef],
  );

  // Two independent subscriptions, each returning a primitive — `getSnapshot`
  // must return a value stable under `Object.is` when nothing changed, which
  // a fresh `{ overflowStart, overflowEnd }` object literal on every call
  // could never satisfy (the same reason `Table`'s own hook reads
  // `scrollable` and `captionId` as two separate calls rather than one).
  const overflowStart = useSyncExternalStore(
    subscribe,
    () => readOverflow(listRef.current, "first"),
    () => false,
  );
  const overflowEnd = useSyncExternalStore(
    subscribe,
    () => readOverflow(listRef.current, "last"),
    () => false,
  );

  return { overflowStart, overflowEnd };
}
