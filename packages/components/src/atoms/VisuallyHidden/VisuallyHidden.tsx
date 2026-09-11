import { cx } from "@dbm-design-system/primitives";
import { VisuallyHidden as RadixVisuallyHidden } from "@radix-ui/react-visually-hidden";
import { forwardRef } from "react";
import styles from "./VisuallyHidden.module.css";
import type { VisuallyHiddenProps } from "./VisuallyHidden.types";

/**
 * Hides content visually while keeping it in the accessibility tree, so
 * screen reader users still get information sighted users would otherwise
 * only infer from visual context — icon-only button labels, supplemental
 * instructions, skip links.
 *
 * Applies a fixed, well-established CSS technique (absolute positioning
 * clipped to a 1px box) rather than `display: none` or `visibility: hidden`,
 * both of which would also remove the content from the accessibility tree.
 * Supports `asChild` (inherited from the underlying Radix `VisuallyHidden`,
 * which renders through `Primitive.span`'s `Slot` mechanism) to apply the
 * hidden styling directly to the child instead of wrapping it in an extra
 * `<span>`.
 *
 * `focusable` reveals the content in normal document flow the moment it (or
 * a focusable descendant) receives focus — the classic skip-link pattern
 * (hidden for mouse/screen-reader users, visible for sighted keyboard
 * users), matching react-aria's own `isFocusable` for this same pattern.
 * Reveal only restores normal layout; it adds no background
 * or positioning of its own, so style the revealed state yourself if it
 * needs to stand out.
 *
 * @example
 * ```tsx
 * // A plain native icon-only button — IconButton itself never renders
 * // `children` outside `asChild` mode, so this pattern only applies to a
 * // hand-rolled button, not IconButton's own `icon` prop.
 * <button type="button">
 *   <Trash />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 * ```
 *
 * @example Skip link
 * ```tsx
 * <VisuallyHidden asChild focusable>
 *   <a href="#main-content">Skip to main content</a>
 * </VisuallyHidden>
 * ```
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ focusable = false, className, ...props }, ref) => (
    <RadixVisuallyHidden
      ref={ref}
      className={focusable ? cx(styles.focusable, className) : className}
      {...props}
    />
  ),
);

VisuallyHidden.displayName = "VisuallyHidden";
