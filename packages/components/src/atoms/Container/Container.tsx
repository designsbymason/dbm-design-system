import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Container.module.css";
import type { ContainerProps, ContainerSize } from "./Container.types";

// CSS module imports are typed via an index signature (see
// src/types/css-modules.d.ts), so noUncheckedIndexedAccess makes every
// lookup `string | undefined` even for known keys — cx() already accepts
// undefined, so this map is typed to match rather than asserted away.
const sizeClass: Record<ContainerSize, string | undefined> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
  full: styles.sizeFull,
};

/**
 * Centers its children and constrains them to a max-width breakpoint step,
 * with token-driven horizontal padding. The standard top-level wrapper for
 * page/section content.
 *
 * @example
 * ```tsx
 * <Container size="lg">
 *   <PageContent />
 * </Container>
 * ```
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "xl", className, ...props }, ref) => (
    <div ref={ref} className={cx(styles.root, sizeClass[size], className)} {...props} />
  ),
);

Container.displayName = "Container";
