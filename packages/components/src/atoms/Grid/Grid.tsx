import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import { responsiveStyle } from "../../utils/responsiveStyle";
import styles from "./Grid.module.css";
import type { GridProps } from "./Grid.types";

type GridComponent = {
  <E extends ElementType = "div">(
    props: GridProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

const GridImpl = forwardRef<HTMLElement, GridProps<ElementType>>(function Grid(
  {
    as,
    columns = 12,
    minChildWidth,
    gap = 0,
    autoFlow,
    autoRows,
    autoColumns,
    className,
    style,
    ...props
  },
  ref,
) {
  const Component = as ?? "div";
  return (
    <Component
      ref={ref}
      className={cx(styles.root, className)}
      style={{
        ...responsiveStyle(columns, "--grid-cols", (value: number) => String(value)),
        ...responsiveStyle(gap, "--grid-gap", (value: number) => `var(--dbm-space-${value})`),
        ...(minChildWidth !== undefined
          ? { gridTemplateColumns: `repeat(auto-fill, minmax(${minChildWidth}, 1fr))` }
          : {}),
        ...(autoFlow !== undefined ? { gridAutoFlow: autoFlow } : {}),
        ...(autoRows !== undefined ? { gridAutoRows: autoRows } : {}),
        ...(autoColumns !== undefined ? { gridAutoColumns: autoColumns } : {}),
        ...style,
      }}
      {...props}
    />
  );
});

/**
 * A CSS Grid layout primitive. Polymorphic via `as` — render as a `<ul>`,
 * `<section>`, or any other element/component while keeping Grid's own
 * layout behavior (the same pattern `Box` and `Stack` use).
 *
 * `columns` accepts a single number for a fixed column count, or a
 * mobile-first responsive map keyed by breakpoint (e.g.
 * `{ base: 1, md: 2, lg: 3 }`). `gap` accepts the same single-value-or-map
 * shape. For a fluid grid that doesn't need explicit breakpoints — "as many
 * columns as fit, each at least this wide" — use `minChildWidth` instead of
 * `columns`.
 *
 * `autoFlow`/`autoRows`/`autoColumns` control how items that aren't
 * explicitly placed (via `GridItem`'s `colStart`/`rowStart`) get arranged —
 * `autoFlow="row dense"` or `"column dense"` backfills gaps left by earlier
 * items with different spans, useful for masonry-like layouts.
 *
 * @example
 * ```tsx
 * <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
 *   <GridItem colSpan={2}><Card /></GridItem>
 *   <GridItem><Card /></GridItem>
 * </Grid>
 * ```
 *
 * @example Fluid grid, no explicit breakpoints
 * ```tsx
 * <Grid minChildWidth="12rem" gap={4}>
 *   <Card />
 *   <Card />
 * </Grid>
 * ```
 */
export const Grid = GridImpl as GridComponent;

Grid.displayName = "Grid";
