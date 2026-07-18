import type { ComponentPropsWithoutRef } from "react";
import type { SpaceValue } from "../Stack/Stack.types";

export type GridBreakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/** A column count (1-12), or a responsive map of breakpoint -> column count. */
export type ResponsiveColumns = number | Partial<Record<GridBreakpoint, number>>;

export interface GridProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Number of columns, or a responsive map keyed by breakpoint, e.g.
   * `{ base: 1, md: 2, lg: 3 }`. Breakpoints follow a mobile-first cascade —
   * each one applies at its `min-width` and above until overridden by a
   * larger breakpoint.
   * @default 12
   */
  columns?: ResponsiveColumns;
  /**
   * Gap between grid cells (both row and column), as a spacing token step.
   * @default 0
   */
  gap?: SpaceValue;
}
