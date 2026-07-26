import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Spacer.module.css";
import type { SpacerProps } from "./Spacer.types";

/**
 * A flex-grow spacer that pushes sibling content apart inside a `Stack` (or
 * any flex container). Renders no content of its own, so it's hidden from
 * the accessibility tree — any `children` passed in are intentionally
 * discarded rather than rendered, since visually showing content that's
 * simultaneously hidden from assistive technology would be inconsistent
 * for screen reader users.
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
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>((props, ref) => {
  // `children` isn't part of the public `SpacerProps` type, but a caller
  // bypassing TypeScript could still pass one at runtime — discard it
  // explicitly rather than relying on the type alone, so the "renders no
  // content of its own" guarantee actually holds regardless of caller.
  const { className, children: _children, ...rest } = props as SpacerProps & { children?: unknown };
  return <div ref={ref} aria-hidden="true" className={cx(styles.root, className)} {...rest} />;
});

Spacer.displayName = "Spacer";
