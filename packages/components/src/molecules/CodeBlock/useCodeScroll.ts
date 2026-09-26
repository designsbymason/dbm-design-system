import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

/**
 * Whether a code block's scroll frame currently overflows, so the frame can be a keyboard-reachable, named
 * region only while it actually scrolls (WCAG 2.1.1) instead of adding a permanent, meaningless tab stop to
 * every short snippet. The same pattern, and the same reasons, as `Table`'s `useScrollableRegion`
 * ([ADR-0019]), built on `useSyncExternalStore` so the region is correct on the first frame.
 *
 * One difference: a collapsed block clips its height on purpose (`overflow-y: hidden`), and clipped content
 * is not something a keyboard can scroll to, so while `clipped` is true only sideways overflow counts.
 */
export function useCodeScroll(frameRef: RefObject<HTMLDivElement | null>, clipped: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const frame = frameRef.current;
      if (!frame || typeof ResizeObserver === "undefined") return noop;
      const observer = new ResizeObserver(onChange);
      observer.observe(frame);
      if (frame.firstElementChild) observer.observe(frame.firstElementChild);
      return () => observer.disconnect();
    },
    [frameRef],
  );
  const read = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return false;
    return frame.scrollWidth > frame.clientWidth || (!clipped && frame.scrollHeight > frame.clientHeight);
  }, [frameRef, clipped]);
  return useSyncExternalStore(subscribe, read, () => false);
}
