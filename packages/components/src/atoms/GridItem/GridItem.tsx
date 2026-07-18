import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./GridItem.module.css";
import type { GridItemProps } from "./GridItem.types";

/**
 * A cell within a `Grid`, with props for how many columns/rows it spans and
 * where it starts. Column/row span and line numbers are structural grid
 * placement math, not design values, so they're plain numbers rather than
 * tokens.
 *
 * @example
 * ```tsx
 * <Grid columns={4} gap={4}>
 *   <GridItem colSpan={2}>Wide cell</GridItem>
 *   <GridItem>Cell</GridItem>
 *   <GridItem>Cell</GridItem>
 * </Grid>
 * ```
 */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ colSpan, rowSpan, colStart, rowStart, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(styles.root, className)}
      style={{
        gridColumn:
          colStart !== undefined
            ? `${colStart} / span ${colSpan ?? 1}`
            : colSpan !== undefined
              ? `span ${colSpan}`
              : undefined,
        gridRow:
          rowStart !== undefined
            ? `${rowStart} / span ${rowSpan ?? 1}`
            : rowSpan !== undefined
              ? `span ${rowSpan}`
              : undefined,
        ...style,
      }}
      {...props}
    />
  ),
);

GridItem.displayName = "GridItem";
