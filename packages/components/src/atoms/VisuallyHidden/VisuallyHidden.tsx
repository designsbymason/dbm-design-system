import { VisuallyHidden as RadixVisuallyHidden } from "@radix-ui/react-visually-hidden";
import { forwardRef } from "react";
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
 * Not configurable, so it has no accompanying CSS module.
 *
 * @example
 * ```tsx
 * <IconButton icon={Trash}>
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </IconButton>
 * ```
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>((props, ref) => (
  <RadixVisuallyHidden ref={ref} {...props} />
));

VisuallyHidden.displayName = "VisuallyHidden";
