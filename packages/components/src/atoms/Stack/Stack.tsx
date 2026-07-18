import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Stack.module.css";
import type { StackAlign, StackJustify, StackProps } from "./Stack.types";

// CSS module imports are typed via an index signature (see
// src/types/css-modules.d.ts), so noUncheckedIndexedAccess makes every
// lookup `string | undefined` even for known keys — cx() already accepts
// undefined, so these maps are typed to match rather than asserted away.
const alignClass: Record<StackAlign, string | undefined> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
  baseline: styles.alignBaseline,
};

const justifyClass: Record<StackJustify, string | undefined> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
  around: styles.justifyAround,
  evenly: styles.justifyEvenly,
};

/**
 * A flex layout primitive for stacking children vertically or horizontally
 * with a consistent, token-driven gap.
 *
 * @example
 * ```tsx
 * <Stack direction="row" gap={4} align="center">
 *   <Icon />
 *   <Text>Label</Text>
 * </Stack>
 * ```
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = "column",
      gap = 0,
      align = "stretch",
      justify = "start",
      wrap = false,
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cx(
        styles.root,
        direction === "row" ? styles.row : styles.column,
        alignClass[align],
        justifyClass[justify],
        wrap && styles.wrap,
        className,
      )}
      style={{ gap: `var(--dbm-space-${gap})`, ...style }}
      {...props}
    />
  ),
);

Stack.displayName = "Stack";
