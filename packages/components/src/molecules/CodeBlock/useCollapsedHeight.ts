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
      // Only the code is observed, not the frame it sits in, and a change is applied on the next animation frame,
      // not inside the observer's own callback. Applying it there would set the frame's height — an ancestor of the
      // code being observed — during delivery, which the browser reports as a "ResizeObserver loop" error that an
      // app's error tracking would log. (The first read, when the block mounts, is still synchronous.)
      const code = frame.firstElementChild;
      if (!code) return noop;
      let pending = 0;
      const observer = new ResizeObserver(() => {
        window.cancelAnimationFrame(pending);
        pending = window.requestAnimationFrame(onChange);
      });
      observer.observe(code);
      return () => {
        window.cancelAnimationFrame(pending);
        observer.disconnect();
      };
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
