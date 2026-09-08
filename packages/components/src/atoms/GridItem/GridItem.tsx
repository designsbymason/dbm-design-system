import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import styles from "./GridItem.module.css";
import type { GridItemProps } from "./GridItem.types";

type GridItemComponent = {
  <E extends ElementType = "div">(
    props: GridItemProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// Flags any responsive-map or single value <= 0 — `span`/`grid-column`/
// `grid-row` are invalid per the CSS Grid spec for a non-positive integer,
// so the browser silently ignores the whole declaration rather than
// clamping it, which reads as "colSpan did nothing" with no error anywhere.
function hasNonPositiveValue(value: number | Partial<Record<string, number>> | undefined) {
  if (value === undefined) return false;
  if (typeof value === "number") return value <= 0;
  return Object.values(value).some((entry) => entry !== undefined && entry <= 0);
}

const GridItemImpl = forwardRef<HTMLElement, GridItemProps<ElementType>>(
  function GridItem(
    { as, colSpan, rowSpan, colStart, rowStart, order, className, style, ...props },
    ref,
  ) {
    const Component = as ?? "div";

    const hasWarnedNonPositiveSpanRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        (hasNonPositiveValue(colSpan) || hasNonPositiveValue(rowSpan)) &&
        !hasWarnedNonPositiveSpanRef.current
      ) {
        hasWarnedNonPositiveSpanRef.current = true;
        console.warn(
          "GridItem: `colSpan`/`rowSpan` must be a positive integer — a zero or negative value is invalid per the CSS Grid spec, so the browser silently ignores the whole placement instead of clamping it.",
        );
      }
    }

    return (
      <Component
        ref={ref}
        className={cx(styles.root, className)}
        style={{
          ...responsiveStyle(
            colStart,
            "--griditem-col-start",
            (value: number) => String(value),
          ),
          ...responsiveStyle(colSpan, "--griditem-col-span", (value: number) =>
            String(value),
          ),
          ...responsiveStyle(
            rowStart,
            "--griditem-row-start",
            (value: number) => String(value),
          ),
          ...responsiveStyle(rowSpan, "--griditem-row-span", (value: number) =>
            String(value),
          ),
          ...responsiveStyle(order, "--griditem-order", (value: number) => String(value)),
          ...style,
        }}
        {...props}
      />
    );
  },
);

/**
 * A cell within a `Grid`, with props for how many columns/rows it spans and
 * where it starts. Column/row span and line numbers are structural grid
 * placement math, not design values, so they're plain numbers rather than
 * tokens. Polymorphic via `as` — render as a `<li>`, `<article>`, or any
 * other element/component while keeping GridItem's own placement behavior
 * (the same pattern `Box`, `Stack`, and `Grid` use).
 *
 * Every prop accepts a single value or a mobile-first responsive map keyed
 * by breakpoint (e.g. `{ base: 4, md: 2 }`), matching `Grid`'s own
 * `columns`/`gap` — so an item can span 2 of 4 columns on desktop and drop
 * to full-width on mobile without any manual breakpoint check. `order`
 * reorders an item visually (CSS `order`) independent of its DOM position —
 * useful for e.g. showing a sidebar before the main content on mobile while
 * keeping the source order (and reading/tab order) unchanged.
 *
 * @example
 * ```tsx
 * <Grid columns={4} gap={4}>
 *   <GridItem colSpan={{ base: 4, md: 2 }}>Wide cell</GridItem>
 *   <GridItem>Cell</GridItem>
 *   <GridItem>Cell</GridItem>
 * </Grid>
 * <Grid columns={2} gap={4}>
 *   <GridItem order={{ base: 2, md: 1 }}>Main content</GridItem>
 *   <GridItem order={{ base: 1, md: 2 }}>Sidebar (shown first on mobile)</GridItem>
 * </Grid>
 * ```
 */
export const GridItem = GridItemImpl as GridItemComponent;

GridItem.displayName = "GridItem";
