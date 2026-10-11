import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Says when an overlay has finished opening and finished closing, which `onOpenChange` can't: that fires when the
 * change *starts*. Rendered inside the panel and drawing nothing.
 *
 * - **Opened:** once the entrance's animations have finished (at once where there are none), and only if the panel
 *   is still open by then.
 * - **Closed:** when the panel is taken out of the page, which Radix does after the exit animation has finished.
 *   The panel's content unmounts then, so this reads it from the cleanup of an effect that only ever runs while
 *   the panel is closed. React's `StrictMode` simulates an unmount while the panel is still open, which is
 *   ignored by the same test.
 */
export function OverlayLifecycle({
  open,
  panelRef,
  onOpenChangeComplete,
}: {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
}) {
  const latest = useRef({ open, onOpenChangeComplete });
  useEffect(() => {
    latest.current = { open, onOpenChangeComplete };
  });

  // The entrance has finished.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const settle = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const animations = panelRef.current?.getAnimations?.() ?? [];
      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
      if (!cancelled && latest.current.open) latest.current.onOpenChangeComplete?.(true);
    };
    void settle();
    return () => {
      cancelled = true;
    };
  }, [open, panelRef]);

  // The exit has finished: the panel is being taken out of the page, and it is closed.
  useEffect(
    () => () => {
      if (!latest.current.open) latest.current.onOpenChangeComplete?.(false);
    },
    [],
  );

  return null;
}
