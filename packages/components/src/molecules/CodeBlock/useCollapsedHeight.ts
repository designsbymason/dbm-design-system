import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

/**
 * How tall a collapsed block's frame has to be to show its first `lines` whole lines, in pixels, or 0 when the
 * stylesheet's own height is right. Only a block that wraps needs measuring: without wrapping every line is one
 * row, so `lines` rows of the line height is exact, but a wrapped line is as many rows as it needs, and cutting
 * the frame at a fixed number of rows would slice a line in half and show fewer lines than the button promises.
 *
 * Read with `useSyncExternalStore`, like `useCodeScroll`, so the height is right on the first frame; it
 * re-reads when the frame or its code resize (a wrap changes with the width). Reading a line's position is
 * unaffected by the frame clipping it, so setting the height does not change what is measured.
 */
export function useCollapsedHeight(frameRef: RefObject<HTMLDivElement | null>, enabled: boolean, lines: number): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const frame = frameRef.current;
      if (!enabled || !frame || typeof ResizeObserver === "undefined") return noop;
      const observer = new ResizeObserver(onChange);
      observer.observe(frame);
      if (frame.firstElementChild) observer.observe(frame.firstElementChild);
      return () => observer.disconnect();
    },
    [frameRef, enabled],
  );
  const read = useCallback(() => {
    const frame = frameRef.current;
    if (!enabled || !frame) return 0;
    const last = frame.querySelectorAll("[data-line]")[lines - 1];
    if (!last) return 0;
    // The line's bottom edge, measured from the frame's own top (its scroll position cancels out).
    return Math.ceil(last.getBoundingClientRect().bottom - frame.getBoundingClientRect().top + frame.scrollTop);
  }, [frameRef, enabled, lines]);
  return useSyncExternalStore(subscribe, read, () => 0);
}
