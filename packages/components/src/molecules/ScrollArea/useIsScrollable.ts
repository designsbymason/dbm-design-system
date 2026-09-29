import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

export type ScrollableAxis = "x" | "y" | "both";

const noop = () => {};

function overflows(el: HTMLDivElement, axis: ScrollableAxis): boolean {
  const overflowsX = el.scrollWidth > el.clientWidth;
  const overflowsY = el.scrollHeight > el.clientHeight;
  if (axis === "x") return overflowsX;
  if (axis === "y") return overflowsY;
  return overflowsX || overflowsY;
}

/**
 * Tracks whether a scroll container's content currently overflows it along
 * the axis (or axes) actually offered, so the container becomes a
 * keyboard-reachable region (WCAG 2.1.1) only while it genuinely scrolls —
 * not a permanent, meaningless tab stop on content that already fits.
 *
 * Built on `useSyncExternalStore`, the same technique already established
 * for `Table`'s own scroll container (`Table/useScrollableRegion.ts`):
 * React re-reads the snapshot right after the first commit and, if it
 * changed, re-renders synchronously before paint — an effect-plus-state
 * version only learns about overflow one tick later, a real
 * `scrollable-region-focusable` failure the instant a story with
 * overflowing content first renders. Not yet extracted into a shared
 * `primitives` hook alongside `Table`'s copy (which reports one combined
 * boolean and never needs a specific axis) — flagged as a DRY opportunity
 * rather than touching `Table`, an already-Finalized component, without
 * asking first.
 *
 * Subsequent changes (viewport resize, content change) arrive via
 * `ResizeObserver` on both the container and its first child (`Viewport`'s
 * own inner content-measuring wrapper, for `ScrollArea`). Guarded for
 * environments without it: those just never re-check after the first
 * commit, leaving the container unfocusable rather than crashing.
 */
export function useIsScrollable(containerRef: RefObject<HTMLDivElement | null>, axis: ScrollableAxis): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const container = containerRef.current;
      if (!container || typeof ResizeObserver === "undefined") return noop;
      const observer = new ResizeObserver(onChange);
      observer.observe(container);
      if (container.firstElementChild) observer.observe(container.firstElementChild);
      return () => observer.disconnect();
    },
    [containerRef],
  );

  return useSyncExternalStore(
    subscribe,
    () => (containerRef.current ? overflows(containerRef.current, axis) : false),
    () => false,
  );
}
