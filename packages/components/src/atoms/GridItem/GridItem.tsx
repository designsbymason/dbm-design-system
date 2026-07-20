import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import { responsiveStyle } from "../../utils/responsiveStyle";
import styles from "./GridItem.module.css";
import type { GridItemProps } from "./GridItem.types";

type GridItemComponent = {
  <E extends ElementType = "div">(
    props: GridItemProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

const GridItemImpl = forwardRef<HTMLElement, GridItemProps<ElementType>>(function GridItem(
  { as, colSpan, rowSpan, colStart, rowStart, className, style, ...props },
  ref,
) {
  const Component = as ?? "div";
  return (
    <Component
      ref={ref}
      className={cx(styles.root, className)}
      style={{
        ...responsiveStyle(colStart, "--griditem-col-start", (value: number) => String(value)),
        ...responsiveStyle(colSpan, "--griditem-col-span", (value: number) => String(value)),
        ...responsiveStyle(rowStart, "--griditem-row-start", (value: number) => String(value)),
        ...responsiveStyle(rowSpan, "--griditem-row-span", (value: number) => String(value)),
        ...style,
      }}
      {...props}
    />
  );
});

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
 * to full-width on mobile without any manual breakpoint check.
 *
 * @example
 * ```tsx
 * <Grid columns={4} gap={4}>
 *   <GridItem colSpan={{ base: 4, md: 2 }}>Wide cell</GridItem>
 *   <GridItem>Cell</GridItem>
 *   <GridItem>Cell</GridItem>
 * </Grid>
 * ```
 */
export const GridItem = GridItemImpl as GridItemComponent;

GridItem.displayName = "GridItem";
