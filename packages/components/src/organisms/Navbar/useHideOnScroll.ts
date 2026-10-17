import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** How far (in pixels) the scroll position has to move in one direction between two reads before it counts as a direction. */
const SCROLL_DIRECTION_THRESHOLD = 4;

/**
 * Whether a sticky bar should be out of the way: true while the reader scrolls down past the bar's own height, false as soon
 * as they scroll up or are back near the top. Reads the page's scroll, or `scrollContainerRef`'s when it is given, from a
 * passive listener batched to one read per frame. Nothing is read until it is enabled and mounted, so a server render and the
 * first client render agree (the bar starts shown).
 */
export function useHideOnScroll(
  enabled: boolean,
  barRef: RefObject<HTMLElement | null>,
  scrollContainerRef: RefObject<HTMLElement | null> | undefined,
): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const container = scrollContainerRef?.current ?? null;
    const position = () => (container ? container.scrollTop : window.scrollY);
    let last = position();
    let frame = 0;

    const read = () => {
      frame = 0;
      const current = position();
      const delta = current - last;
      const barHeight = barRef.current?.getBoundingClientRect().height ?? 0;
      if (current <= barHeight) {
        setHidden(false);
        last = current;
      } else if (delta > SCROLL_DIRECTION_THRESHOLD) {
        setHidden(true);
        last = current;
      } else if (delta < -SCROLL_DIRECTION_THRESHOLD) {
        setHidden(false);
        last = current;
      }
    };
    const handleScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };

    const target: HTMLElement | Window = container ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", handleScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      setHidden(false);
    };
  }, [enabled, barRef, scrollContainerRef]);

  return enabled && hidden;
}
