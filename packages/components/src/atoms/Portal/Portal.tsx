import { Portal as RadixPortal } from "@radix-ui/react-portal";
import { forwardRef } from "react";
import type { PortalProps } from "./Portal.types";

/**
 * Renders its children into a different part of the DOM — by default,
 * `document.body` — while preserving their position in the React tree for
 * events, context, and props. Used internally by overlay components
 * (Dialog, Popover, Tooltip, Toast) so they escape parent `overflow`,
 * `z-index`, and `transform` stacking contexts; also usable directly.
 *
 * Purely structural — it renders no visual chrome of its own, so it has no
 * accompanying CSS module.
 *
 * @example
 * ```tsx
 * <Portal>
 *   <div role="dialog">...</div>
 * </Portal>
 * ```
 */
export const Portal = forwardRef<HTMLDivElement, PortalProps>((props, ref) => (
  <RadixPortal ref={ref} {...props} />
));

Portal.displayName = "Portal";
