import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

export interface ScrollableRegionState {
  /** Whether the container's content currently overflows it, on either axis. */
  scrollable: boolean;
  /** The DOM id of the table's own `<caption>`, if it has one — what the scroll region names itself after. */
  captionId: string | undefined;
}

const noop = () => {};

const readScrollable = (container: HTMLDivElement | null): boolean =>
  container !== null &&
  (container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight);

// Direct children only — a nested table's own caption inside a cell must never
// be mistaken for this table's.
const readCaptionId = (container: HTMLDivElement | null): string | undefined => {
  const table = container?.firstElementChild;
  const caption = table ? Array.from(table.children).find((child) => child.tagName === "CAPTION") : undefined;
  return caption?.id || undefined;
};

/**
 * Tracks whether a table's scroll container is currently overflowing, so the
 * container can become a keyboard-reachable, labelled region only while it
 * actually scrolls (WCAG 2.1.1 — a scrollable region must be operable from
 * the keyboard) instead of adding a permanent, meaningless tab stop to every
 * table that happens to fit.
 *
 * Built on `useSyncExternalStore` — the layout of the DOM is external,
 * mutable state React doesn't own — rather than an effect that sets state:
 * React re-reads the snapshot right after the first commit and re-renders
 * synchronously *before paint* if it changed, so the region is already
 * correct on the first frame. (An effect-plus-`ResizeObserver`-callback
 * version only learns about overflow one async tick later, leaving a window
 * where the container scrolls but isn't yet focusable — a real
 * `scrollable-region-focusable` failure in an automated accessibility check
 * that runs the moment a story renders.)
 *
 * Subsequent changes (viewport resize, content change) arrive via
 * `ResizeObserver` on both the container and its `<table>`. Guarded for
 * environments without it: those just never re-check after the first
 * commit, leaving the container unfocusable rather than crashing.
 */
export function useScrollableRegion(containerRef: RefObject<HTMLDivElement | null>): ScrollableRegionState {
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

  const scrollable = useSyncExternalStore(
    subscribe,
    () => readScrollable(containerRef.current),
    () => false,
  );
  const captionId = useSyncExternalStore(
    subscribe,
    () => readCaptionId(containerRef.current),
    () => undefined,
  );

  return { scrollable, captionId };
}
