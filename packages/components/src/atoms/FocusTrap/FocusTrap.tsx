import { FocusScope } from "@radix-ui/react-focus-scope";
import { forwardRef } from "react";
import type { FocusTrapProps } from "./FocusTrap.types";

/**
 * Manages focus within a region — traps Tab/Shift+Tab cycling inside its
 * children, optionally looping from the last focusable element back to the
 * first (and vice versa), and controls what receives focus on mount/unmount.
 * Used internally by Dialog/Drawer/Popover-style overlays to keep keyboard
 * focus from escaping while they're open; also usable directly for any
 * custom overlay.
 *
 * Purely behavioral — it renders no visual chrome of its own, so it has no
 * accompanying CSS module.
 *
 * @example
 * ```tsx
 * <FocusTrap trapped loop>
 *   <div role="dialog">...</div>
 * </FocusTrap>
 * ```
 */
export const FocusTrap = forwardRef<HTMLDivElement, FocusTrapProps>((props, ref) => (
  <FocusScope ref={ref} {...props} />
));

FocusTrap.displayName = "FocusTrap";
