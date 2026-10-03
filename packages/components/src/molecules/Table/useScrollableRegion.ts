import { useIsScrollable } from "@dbm-design-system/primitives";
import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

export interface ScrollableRegionState {
  /** Whether the container's content currently overflows it, on either axis. */
  scrollable: boolean;
  /** The DOM id of the table's own `<caption>`, if it has one — what the scroll region names itself after. */
  captionId: string | undefined;
}

const noop = () => {};

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
 * `scrollable` itself is `useIsScrollable(containerRef, "both")` — the
 * shared `primitives` hook `ScrollArea` also uses, extracted here
 * 2026-10-02 (an authorized, zero-behavior-change refactor; this hook's own
 * return shape and every caller are unchanged, so `Table`'s finalized status
 * holds per `06-engineering-standards.md` §9's three-question test). The
 * `captionId` lookup stays local — it's specific to this component's own
 * `<caption>` convention, not a general scroll-detection concern.
 *
 * `captionId`'s own `useSyncExternalStore`, below, still needs its own
 * `ResizeObserver` subscription (a caption's presence/id can't change
 * without a re-render touching this hook anyway, but kept symmetrical with
 * `scrollable`'s own subscription rather than assumed stale-safe) — built on
 * the same technique for the same reason: React re-reads the snapshot right
 * after the first commit and re-renders synchronously *before paint* if it
 * changed, so the region is already correct on the first frame, unlike an
 * effect-plus-`ResizeObserver`-callback version, which only learns one
 * async tick later.
 */
export function useScrollableRegion(containerRef: RefObject<HTMLDivElement | null>): ScrollableRegionState {
  const scrollable = useIsScrollable(containerRef, "both");

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

  const captionId = useSyncExternalStore(
    subscribe,
    () => readCaptionId(containerRef.current),
    () => undefined,
  );

  return { scrollable, captionId };
}
