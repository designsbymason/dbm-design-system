import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { CSSProperties } from "react";
import styles from "./Grid.module.css";
import type { GridProps, ResponsiveColumns } from "./Grid.types";

function columnStyle(columns: ResponsiveColumns): CSSProperties {
  const entries =
    typeof columns === "number" ? { base: columns } : columns;
  const style: Record<string, number> = {};
  for (const [breakpoint, value] of Object.entries(entries)) {
    if (value !== undefined) style[`--grid-cols-${breakpoint}`] = value;
  }
  return style as CSSProperties;
}

/**
 * A CSS Grid layout primitive with a responsive `columns` prop — pass a
 * single number for a fixed column count, or a breakpoint map for a
 * mobile-first responsive grid.
 *
 * @example
 * ```tsx
 * <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
 *   <GridItem colSpan={2}><Card /></GridItem>
 *   <GridItem><Card /></GridItem>
 * </Grid>
 * ```
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ columns = 12, gap = 0, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      style={{ gap: `var(--dbm-space-${gap})`, ...columnStyle(columns), ...style }}
      {...props}
    />
  ),
);

Grid.displayName = "Grid";
