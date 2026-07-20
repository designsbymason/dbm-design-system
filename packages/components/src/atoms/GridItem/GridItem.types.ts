import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { Responsive } from "../../types/tokens";

export type GridItemProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Number of columns this item spans — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g. `{ base: 4, md: 2 }`).
   */
  colSpan?: Responsive<number>;
  /**
   * Number of rows this item spans — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   */
  rowSpan?: Responsive<number>;
  /**
   * Explicit starting column line (1-indexed, per the CSS Grid spec) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   */
  colStart?: Responsive<number>;
  /**
   * Explicit starting row line (1-indexed, per the CSS Grid spec) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   */
  rowStart?: Responsive<number>;
  /** The content to render inside the grid cell. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
