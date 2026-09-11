import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import type {
  Breakpoint,
  Responsive,
  SpaceValue,
} from "@dbm-design-system/primitives";

export type { SpaceValue } from "@dbm-design-system/primitives";

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

/**
 * How items align *within their own cell* along a single axis
 * (`justify-items`/`align-items`) — a per-item alignment, distinct from
 * `GridContentAlign` below, which positions the grid's tracks as a whole.
 */
export type GridItemsAlign = "start" | "center" | "end" | "stretch" | "baseline";

/**
 * How the grid's own tracks are positioned within the container along a
 * single axis (`justify-content`/`align-content`) — only visible when the
 * grid's total track size is smaller than the container, distinct from
 * `GridItemsAlign` above, which aligns each item within its own cell.
 */
export type GridContentAlign =
  | "start"
  | "center"
  | "end"
  | "stretch"
  | "between"
  | "around"
  | "evenly";

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
  /**
   * `justify-items` — how each item aligns within its own cell along the
   * inline (horizontal) axis — a single value, or a mobile-first responsive
   * map keyed by breakpoint. Unset by default (native `normal` behavior,
   * unchanged from before this prop existed).
   */
  justifyItems?: Responsive<GridItemsAlign>;
  /**
   * `align-items` — how each item aligns within its own cell along the
   * block (vertical) axis — a single value, or a mobile-first responsive
   * map keyed by breakpoint. Unset by default (native `normal` behavior,
   * unchanged from before this prop existed).
   */
  alignItems?: Responsive<GridItemsAlign>;
  /**
   * `justify-content` — how the grid's own column tracks are positioned
   * within the container along the inline axis, when their total size is
   * smaller than the container — a single value, or a mobile-first
   * responsive map keyed by breakpoint. Unset by default (native `normal`
   * behavior, unchanged from before this prop existed).
   *
   * **Has no visible effect under `Grid`'s own default track sizing** —
   * both `columns` and `minChildWidth` generate `1fr`-based column tracks,
   * which always expand to fill 100% of the container's inline size by
   * definition, leaving no leftover space to position. Only relevant when
   * overriding `gridTemplateColumns` directly via `style` with fixed
   * (non-`fr`) track sizes.
   */
  justifyContent?: Responsive<GridContentAlign>;
  /**
   * `align-content` — how the grid's own row tracks are positioned within
   * the container along the block axis, when their total size is smaller
   * than the container — a single value, or a mobile-first responsive map
   * keyed by breakpoint. Unset by default (native `normal` behavior,
   * unchanged from before this prop existed).
   *
   * Unlike `justifyContent`, this one *is* reachable through `Grid`'s own
   * props today: row tracks size to their content by default (or to
   * `autoRows` when set), neither of which is `fr`-based — so a `Grid`
   * with an explicit height taller than its row content leaves real
   * leftover block-axis space for this to position within.
   */
  alignContent?: Responsive<GridContentAlign>;
  /** The content to lay out in the grid. */
  children?: ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * component, or a test/router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
