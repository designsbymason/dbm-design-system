import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import styles from "./Grid.module.css";
import type {
  GridContentAlign,
  GridItemsAlign,
  GridProps,
} from "./Grid.types";

type GridComponent = {
  <E extends ElementType = "div">(
    props: GridProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// justify-items/align-items values are already valid CSS keywords as-is —
// this map exists only so `GridItemsAlign` stays an explicit, documented
// value set rather than an unchecked passthrough string.
const ITEMS_ALIGN: Record<GridItemsAlign, string> = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch",
  baseline: "baseline",
};

// justify-content/align-content: "between"/"around"/"evenly" need mapping to
// their real CSS `space-*` keywords, matching Stack's identical convention
// for its own justify prop.
const CONTENT_ALIGN: Record<GridContentAlign, string> = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
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
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
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
        ...responsiveStyle(columns, "--grid-cols", (value: number) =>
          String(value),
        ),
        ...responsiveStyle(
          gap,
          "--grid-gap",
          (value: number) => `var(--dbm-space-${value})`,
        ),
        ...responsiveStyle(
          justifyItems,
          "--grid-justify-items",
          (value: GridItemsAlign) => ITEMS_ALIGN[value],
        ),
        ...responsiveStyle(
          alignItems,
          "--grid-align-items",
          (value: GridItemsAlign) => ITEMS_ALIGN[value],
        ),
        ...responsiveStyle(
          justifyContent,
          "--grid-justify-content",
          (value: GridContentAlign) => CONTENT_ALIGN[value],
        ),
        ...responsiveStyle(
          alignContent,
          "--grid-align-content",
          (value: GridContentAlign) => CONTENT_ALIGN[value],
        ),
        ...(minChildWidth !== undefined
          ? {
              gridTemplateColumns: `repeat(auto-fill, minmax(${minChildWidth}, 1fr))`,
            }
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
 * `justifyItems`/`alignItems` align each item *within its own cell*;
 * `justifyContent`/`alignContent` position the grid's own tracks *within
 * the container* when their total size is smaller than the container. All
 * four accept a single value or a mobile-first responsive map, matching
 * every other prop here.
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
 *
 * @example Centering short content within its cells
 * ```tsx
 * <Grid columns={3} gap={4} justifyItems="center" alignItems="center">
 *   <Icon size="lg" />
 *   <Icon size="lg" />
 *   <Icon size="lg" />
 * </Grid>
 * ```
 */
export const Grid = GridImpl as GridComponent;

Grid.displayName = "Grid";
