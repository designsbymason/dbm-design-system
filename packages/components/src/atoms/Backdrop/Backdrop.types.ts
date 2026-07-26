import type { ComponentPropsWithoutRef } from "react";

/** An opacity-scale step, matching the primitive opacity token steps. */
export type BackdropOpacity = 0 | 5 | 10 | 20 | 40 | 60 | 80 | 90 | 100;

export interface BackdropProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Renders into a portal (`document.body` by default) instead of in
   * place. Set to `false` when composing inside a parent that already
   * provides its own portal — e.g. a future `Dialog`, which portals its
   * backdrop and content together in one call, the same way Radix's own
   * `Dialog.Portal` wraps `Dialog.Overlay` + `Dialog.Content` as siblings.
   * @default true
   */
  inPortal?: boolean;
  /**
   * Applies a `backdrop-filter: blur(...)` in addition to the dimming
   * fill, for a frosted-glass effect.
   * @default false
   */
  blur?: boolean;
  /**
   * How opaque the dimming fill is, from the opacity token scale.
   * @default 60
   */
  opacity?: BackdropOpacity;
}
