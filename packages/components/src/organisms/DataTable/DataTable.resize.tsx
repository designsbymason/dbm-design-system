import { cx } from "@dbm-design-system/primitives";
import { useCallback, useEffect, useRef, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./DataTable.module.css";
import { readLengthToken } from "./DataTable.length";

// What an arrow key moves a column by, a spacing step read from its token; and the fallbacks for a page with no stylesheet to read.
const FALLBACK_STEP_PX = 16;
const FALLBACK_MINIMUM_PX = 64;
const LARGE_STEP = 4;

const noSubscription = () => () => undefined;

export interface ColumnResizeHandleProps {
  /** The name of the column this handle resizes. */
  label: string;
  /** What the handle's name says when it is read: "Resize Name column". */
  name: string;
  /** The id of the element that says what the keys are, which the table draws once. */
  hintId: string;
  /** The narrowest and widest the column may be, in pixels (`Infinity` for no widest). */
  minimum: number | undefined;
  maximum: number | undefined;
  /** Whether the header it sits in is a solid colour, which the focus ring has to read against. */
  tinted: boolean;
  /** Called with the width a gesture asks for, in whole pixels. */
  onResize: (width: number) => void;
  /** Called to put the column back to the width it began with. */
  onReset: () => void;
}

/**
 * The handle at the end edge of a column's header: a focusable separator (the window-splitter pattern) that is dragged with a
 * pointer, or moved with the arrow keys (Shift for larger steps, Home for the narrowest, End for the widest, Enter to reset). The
 * keys follow the page's direction, since "right" means wider in a left-to-right page and narrower in a right-to-left one.
 */
export function ColumnResizeHandle({ label, name, hintId, minimum, maximum, tinted, onResize, onReset }: ColumnResizeHandleProps) {
  const handle = useRef<HTMLSpanElement>(null);
  const stop = useRef<(() => void) | undefined>(undefined);
  const cellOf = () => handle.current?.closest("th") ?? null;

  // The column's own width, read from its header cell and read again whenever it changes, however it was changed.
  const subscribe = useCallback((onChange: () => void) => {
    const cell = handle.current?.closest("th");
    if (!cell || typeof ResizeObserver === "undefined") return noSubscription();
    const observer = new ResizeObserver(onChange);
    observer.observe(cell);
    return () => observer.disconnect();
  }, []);
  const width = useSyncExternalStore(
    subscribe,
    () => Math.round(cellOf()?.getBoundingClientRect().width ?? 0),
    () => 0,
  );

  const floor = minimum ?? readLengthToken("--dbm-space-16") ?? FALLBACK_MINIMUM_PX;
  const ceiling = maximum;
  const clamp = (value: number) => Math.round(Math.min(ceiling ?? Number.POSITIVE_INFINITY, Math.max(floor, value)));

  // A drag listens on the window and ends however the pointer ends (`06-engineering-standards.md` §9), and is dropped on unmount.
  useEffect(() => () => stop.current?.(), []);

  const press = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    const cell = cellOf();
    if (!cell) return;
    event.preventDefault();
    handle.current?.focus();
    const rtl = getComputedStyle(cell).direction === "rtl";
    const startX = event.clientX;
    const startWidth = cell.getBoundingClientRect().width;
    try {
      handle.current?.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic or already-ended pointer can't be captured; the window listeners below still follow it.
    }
    const move = (next: PointerEvent) => onResize(clamp(startWidth + (rtl ? startX - next.clientX : next.clientX - startX)));
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      stop.current = undefined;
    };
    stop.current?.();
    stop.current = end;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const key = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    const cell = cellOf();
    const rtl = cell ? getComputedStyle(cell).direction === "rtl" : false;
    const step = (readLengthToken("--dbm-space-4") ?? FALLBACK_STEP_PX) * (event.shiftKey ? LARGE_STEP : 1);
    const current = cell?.getBoundingClientRect().width ?? width;
    let next: number | undefined;
    if (event.key === "ArrowRight") next = current + (rtl ? -step : step);
    else if (event.key === "ArrowLeft") next = current + (rtl ? step : -step);
    else if (event.key === "Home") next = floor;
    else if (event.key === "End" && ceiling !== undefined) next = ceiling;
    else if (event.key === "Enter") {
      event.preventDefault();
      onReset();
      return;
    }
    if (next === undefined) return;
    event.preventDefault();
    onResize(clamp(next));
  };

  return (
    <>
      {/* A focusable separator is an interactive widget (the window-splitter pattern); the lint rules don't know the role is one. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <span
        ref={handle}
        role="separator"
        aria-orientation="vertical"
        aria-label={name}
        aria-describedby={hintId}
        aria-valuemin={Math.round(floor)}
        aria-valuemax={ceiling === undefined ? undefined : Math.round(ceiling)}
        aria-valuenow={width}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-column={label}
        className={cx(styles.resizeHandle, tinted && styles.resizeHandleTinted)}
        onPointerDown={press}
        onKeyDown={key}
        onDoubleClick={onReset}
      />
    </>
  );
}
