import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { Breakpoint, Responsive, SpaceValue } from "../../types/tokens";

export type { SpaceValue } from "../../types/tokens";

/** A breakpoint step, matching the primitive breakpoint tokens. */
export type GridBreakpoint = Breakpoint;

/** A column count (1-12), or a responsive map of breakpoint -> column count. */
export type ResponsiveColumns = Responsive<number>;

/**
 * Controls `grid-auto-flow` — how implicitly-placed items are auto-arranged.
 * The `dense` variants backfill gaps left by earlier items with different
 * spans, useful for masonry-like layouts with mixed-span items.
 */
export type GridAutoFlow = "row" | "column" | "row dense" | "column dense";

export type GridProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Number of columns, or a responsive map keyed by breakpoint, e.g.
   * `{ base: 1, md: 2, lg: 3 }`. Breakpoints follow a mobile-first cascade —
   * each one applies at its `min-width` and above until overridden by a
   * larger breakpoint. Ignored when `minChildWidth` is set.
   * @default 12
   */
  columns?: ResponsiveColumns;
  /**
   * Renders a fluid grid — as many columns as fit, each at least this CSS
   * size wide (e.g. `"12rem"`) — via
   * `repeat(auto-fill, minmax(minChildWidth, 1fr))`, instead of a fixed or
   * responsive column count. Takes precedence over `columns` when set.
   */
  minChildWidth?: string;
  /**
   * Gap between grid cells (both row and column), as a spacing token step —
   * a single value, or a mobile-first responsive map keyed by breakpoint.
   * @default 0
   */
  gap?: Responsive<SpaceValue>;
  /**
   * Controls `grid-auto-flow` — how implicitly-placed items are auto-arranged.
   * @default 'row'
   */
  autoFlow?: GridAutoFlow;
  /** Sets `grid-auto-rows` — the size of implicitly-created rows. */
  autoRows?: string;
  /** Sets `grid-auto-columns` — the size of implicitly-created columns. */
  autoColumns?: string;
  /** The content to lay out in the grid. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
