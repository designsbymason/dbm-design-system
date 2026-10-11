import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/** How far, as a share of its own extent, a panel has to be dragged toward its edge to count as dismissed. */
const DISMISS_RATIO = 0.4;
/** How fast, in pixels per millisecond, a flick has to be to dismiss however short it was... */
const DISMISS_VELOCITY = 0.5;
/** ...as long as it travelled at least this far, so a tap that jitters is not a swipe. */
const MIN_FLICK_DISTANCE = 24;
/** Where a drag starts being a drag, in pixels: less than this is a tap. */
const SLOP = 4;

const INTERACTIVE = "button, a[href], input, select, textarea, [role='button'], [contenteditable='true']";

/** Reads the direction the panel leaves in from its own `--drawer-from` (`translateX(100%)`, `translateY(-100%)`). */
function exitDirection(panel: HTMLElement): { axis: "x" | "y"; sign: 1 | -1 } | null {
  const from = getComputedStyle(panel).getPropertyValue("--drawer-from").trim();
  const match = /^translate([XY])\((-?)\d/.exec(from);
  if (!match) return null;
  return { axis: match[1] === "X" ? "x" : "y", sign: match[2] === "-" ? -1 : 1 };
}

/**
 * Lets a touch or a pen drag the panel toward its edge to dismiss it, from its handle and its header. Rendered
 * inside the panel and drawing nothing.
 *
 * The panel follows the finger through two custom properties (`--drawer-drag-x`, `--drawer-drag-y`) that its
 * stylesheet turns into a transform, so no state or re-render is involved, and the exit animation starts from where
 * the finger left it. A short drag settles back; a long or quick one closes it with the reason `"swipe"`. The
 * direction is read from the panel's own computed geometry, so a responsive `side` and right-to-left text need no
 * separate handling here. A mouse is given the gesture from the handle only: a drag from the header would select the
 * title, and it has a close button.
 */
export function DrawerSwipe({
  panelRef,
  enabled,
  onDismiss,
}: {
  panelRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onDismiss: () => void;
}) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) return undefined;

    let drag: {
      id: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      lastTime: number;
      velocity: number;
      axis: "x" | "y";
      sign: 1 | -1;
      active: boolean;
    } | null = null;

    const reset = () => {
      panel.style.removeProperty("--drawer-drag-x");
      panel.style.removeProperty("--drawer-drag-y");
      panel.removeAttribute("data-dragging");
    };

    const settleBack = () => {
      // The transition is what carries it back, and the attribute is only there to ask for it. It is taken off
      // when that transition ends, or at once when there is none (released where it began, or reduced motion),
      // which `transitionend` would never report.
      panel.setAttribute("data-settling", "");
      reset();
      requestAnimationFrame(() => {
        const running = (panel.getAnimations?.() ?? []).filter((animation) => animation instanceof CSSTransition);
        if (running.length === 0) {
          panel.removeAttribute("data-settling");
          return;
        }
        void Promise.all(running.map((animation) => animation.finished.catch(() => undefined))).then(() =>
          panel.removeAttribute("data-settling"),
        );
      });
    };

    const onDown = (event: PointerEvent) => {
      if (drag || !event.isPrimary) return;
      const target = event.target as Element | null;
      if (!target?.closest("[data-drawer-grab]") || target.closest(INTERACTIVE)) return;
      // A mouse takes hold only at the handle, which has no text to select and invites dragging; a drag from the
      // header would select the title, and it has a close button. A touch and a pen can take hold of either.
      if (event.pointerType === "mouse" && (event.button !== 0 || !target.closest("[data-drawer-handle]"))) return;
      const direction = exitDirection(panel);
      if (!direction) return;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: event.timeStamp,
        velocity: 0,
        ...direction,
        active: false,
      };
    };

    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const travelled =
        drag.axis === "x" ? (event.clientX - drag.startX) * drag.sign : (event.clientY - drag.startY) * drag.sign;
      if (!drag.active) {
        if (Math.abs(travelled) < SLOP) return;
        // Moving away from the edge is not this gesture's: leave it to the page.
        if (travelled < 0) {
          drag = null;
          return;
        }
        drag.active = true;
        panel.setAttribute("data-dragging", "");
        try {
          panel.setPointerCapture(event.pointerId);
        } catch {
          // A synthetic or already-ended pointer can't be captured; the drag still follows the events it gets.
        }
      }
      const clamped = Math.max(0, travelled);
      const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
      const step =
        drag.axis === "x"
          ? (event.clientX - drag.lastX) * drag.sign
          : (event.clientY - drag.lastY) * drag.sign;
      drag.velocity = step / elapsed;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastTime = event.timeStamp;
      const offset = `${clamped * drag.sign}px`;
      panel.style.setProperty("--drawer-drag-x", drag.axis === "x" ? offset : "0px");
      panel.style.setProperty("--drawer-drag-y", drag.axis === "y" ? offset : "0px");
      event.preventDefault();
    };

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (!drag || event.pointerId !== drag.id) return;
      const finished = drag;
      drag = null;
      if (!finished.active) return;
      try {
        panel.releasePointerCapture(event.pointerId);
      } catch {
        // as above: nothing to release
      }
      const travelled =
        finished.axis === "x"
          ? (event.clientX - finished.startX) * finished.sign
          : (event.clientY - finished.startY) * finished.sign;
      const extent = finished.axis === "x" ? panel.offsetWidth : panel.offsetHeight;
      const farEnough = extent > 0 && travelled / extent >= DISMISS_RATIO;
      const quickEnough = finished.velocity >= DISMISS_VELOCITY && travelled >= MIN_FLICK_DISTANCE;
      if (!cancelled && (farEnough || quickEnough)) {
        // Closing starts the exit from where it was left: the offset stays on the panel for the animation to read.
        panel.removeAttribute("data-dragging");
        dismiss.current();
      } else {
        settleBack();
      }
    };

    const onUp = (event: PointerEvent) => finish(event, false);
    const onCancel = (event: PointerEvent) => finish(event, true);

    panel.addEventListener("pointerdown", onDown);
    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerup", onUp);
    panel.addEventListener("pointercancel", onCancel);
    return () => {
      panel.removeEventListener("pointerdown", onDown);
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerup", onUp);
      panel.removeEventListener("pointercancel", onCancel);
    };
  }, [enabled, panelRef]);

  return null;
}
