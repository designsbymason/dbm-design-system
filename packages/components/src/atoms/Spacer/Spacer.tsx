import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Spacer.module.css";
import type { SpacerProps } from "./Spacer.types";

/**
 * A flex-grow spacer that pushes sibling content apart inside a `Stack` (or
 * any flex container). Renders no content of its own, so it's hidden from
 * the accessibility tree.
 *
 * @example
 * ```tsx
 * <Stack direction="row">
 *   <Logo />
 *   <Spacer />
 *   <NavActions />
 * </Stack>
 * ```
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(({ className, ...props }, ref) => (
  <div ref={ref} aria-hidden="true" className={cx(styles.root, className)} {...props} />
));

Spacer.displayName = "Spacer";
