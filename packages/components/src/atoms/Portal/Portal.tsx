import { Portal as RadixPortal } from "@radix-ui/react-portal";
import { forwardRef, useRef } from "react";
import type { PortalProps } from "./Portal.types";

/**
 * Renders its children into a different part of the DOM — by default,
 * `document.body` — while preserving their position in the React tree for
 * events, context, and props. Used internally by overlay components
 * (Dialog, Popover, Tooltip, Toast) so they escape parent `overflow`,
 * `z-index`, and `transform` stacking contexts; also usable directly.
 *
 * Purely structural — it renders no visual chrome of its own, so it has no
 * accompanying CSS module. Supports `asChild` (inherited from the underlying
 * Radix `Portal`, which renders through `Primitive.div`'s `Slot` mechanism)
 * to portal the child itself instead of wrapping it in an extra `<div>`.
 *
 * `disablePortal` renders `children` in place, with no portal and no wrapper
 * element at all — useful for print views, tests that need the DOM
 * structure kept in place, or conditionally turning portaling off without
 * the consumer branching around whether `<Portal>` renders at all. In that
 * mode, `ref`, `container`, and any other div props are ignored since
 * there's no element left to apply them to (a dev-mode warning fires once
 * if a `ref` is passed alongside `disablePortal`).
 *
 * @example
 * ```tsx
 * <Portal>
 *   <div role="dialog">...</div>
 * </Portal>
 * ```
 */
export const Portal = forwardRef<HTMLDivElement, PortalProps>(
  ({ disablePortal = false, children, ...props }, ref) => {
    const hasWarnedRef = useRef(false);

    if (
      process.env.NODE_ENV !== "production" &&
      disablePortal &&
      ref &&
      !hasWarnedRef.current
    ) {
      hasWarnedRef.current = true;
      console.warn(
        "Portal: `ref` has no effect when `disablePortal` is true — no wrapper element is rendered for it to attach to.",
      );
    }

    if (disablePortal) {
      return <>{children}</>;
    }

    return (
      <RadixPortal ref={ref} {...props}>
        {children}
      </RadixPortal>
    );
  },
);

Portal.displayName = "Portal";
