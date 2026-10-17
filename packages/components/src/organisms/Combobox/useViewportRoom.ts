import { useEffect, useState } from "react";
import type { RefObject } from "react";

export interface ViewportRoom {
  /** The width in pixels of the part of the page the person can see (the visual viewport, so a pinch-zoom counts). */
  width: number;
  /** Pixels between the top of what is visible and the top of the element. */
  above: number;
  /** Pixels between the bottom of the element and the bottom of what is visible, which is above an on-screen keyboard. */
  below: number;
}

const sameRoom = (a: ViewportRoom | undefined, b: ViewportRoom) =>
  a !== undefined && a.width === b.width && a.above === b.above && a.below === b.below;

/**
 * How much room there is around an element in the part of the page the person can actually see. A layer positioned
 * against the layout viewport doesn't know about an on-screen keyboard, which on a phone covers the bottom of the
 * screen without changing it: the visual viewport does. Measured while `enabled`, and again when the visual viewport
 * resizes or scrolls, the page or a scrolling ancestor scrolls, or the element changes size. `undefined` until measured
 * (and always on a server).
 */
export function useViewportRoom(anchorRef: RefObject<HTMLElement | null>, enabled: boolean): ViewportRoom | undefined {
  const [room, setRoom] = useState<ViewportRoom | undefined>();

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!enabled || !anchor || typeof window === "undefined") return undefined;
    const visual = window.visualViewport;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const top = visual?.offsetTop ?? 0;
      const next: ViewportRoom = {
        width: visual?.width ?? window.innerWidth,
        above: rect.top - top,
        below: top + (visual?.height ?? window.innerHeight) - rect.bottom,
      };
      setRoom((current) => (sameRoom(current, next) ? current : next));
    };
    // One measurement a frame however many events arrive: a capturing scroll listener hears every scrolling box on the
    // page, the list's own included.
    let pending = 0;
    const schedule = () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        measure();
      });
    };
    const first = requestAnimationFrame(measure);
    visual?.addEventListener("resize", schedule);
    visual?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    observer?.observe(anchor);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(pending);
      visual?.removeEventListener("resize", schedule);
      visual?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
      observer?.disconnect();
    };
  }, [anchorRef, enabled]);

  return enabled ? room : undefined;
}
