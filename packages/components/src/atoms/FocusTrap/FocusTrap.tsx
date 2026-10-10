import { FocusScope } from "@radix-ui/react-focus-scope";
import { forwardRef } from "react";
import type { FocusTrapProps } from "./FocusTrap.types";

/**
 * Manages focus within a region — traps Tab/Shift+Tab cycling inside its
 * children, optionally looping from the last focusable element back to the
 * first (and vice versa), and controls what receives focus on mount/unmount.
 * Keeps keyboard focus from escaping a custom overlay while it's open. An
 * overlay built on a Radix primitive, such as `Dialog` or `Popover`, gets the
 * same behavior from that primitive's own focus scope and doesn't use this.
 *
 * Purely behavioral — it renders no visual chrome of its own beyond a plain
 * wrapping `<div>` (or none at all with `asChild`), so it has no
 * accompanying CSS module. Supports `asChild` (inherited from the
 * underlying Radix `FocusScope`, which renders through `Primitive.div`'s
 * `Slot` mechanism) to merge the trap directly onto `children` instead of
 * adding an extra wrapping `<div>` — useful when `children` is already the
 * element that should own the trap's boundary, e.g. a dialog's own root.
 *
 * @example
 * ```tsx
 * <FocusTrap trapped loop>
 *   <div role="dialog">...</div>
 * </FocusTrap>
 * ```
 *
 * @example Merged onto an existing root, avoiding an extra wrapper `<div>`
 * ```tsx
 * <FocusTrap trapped loop asChild>
 *   <div role="dialog">...</div>
 * </FocusTrap>
 * ```
 */
export const FocusTrap = forwardRef<HTMLDivElement, FocusTrapProps>((props, ref) => (
  <FocusScope ref={ref} {...props} />
));

FocusTrap.displayName = "FocusTrap";
