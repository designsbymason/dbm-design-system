import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { Responsive, SpaceValue } from "../../types/tokens";

export type { SpaceValue } from "../../types/tokens";

export type StackDirection = "row" | "column";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export type StackProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Flex direction of the stack — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g. `{ base: "column", md: "row" }`),
   * matching `Grid`'s `columns` prop.
   * @default 'column'
   */
  direction?: Responsive<StackDirection>;
  /**
   * Gap between children, as a spacing token step (e.g. `4` -> `var(--dbm-space-4)`) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   * @default 0
   */
  gap?: Responsive<SpaceValue>;
  /**
   * `align-items` along the cross axis — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   * @default 'stretch'
   */
  align?: Responsive<StackAlign>;
  /**
   * `justify-content` along the main axis — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   * @default 'start'
   */
  justify?: Responsive<StackJustify>;
  /**
   * Whether children wrap onto new lines when they overflow the main axis —
   * a single value, or a mobile-first responsive map keyed by breakpoint.
   * @default false
   */
  wrap?: Responsive<boolean>;
  /**
   * An element (typically a `Divider`) automatically inserted between every
   * child, so consumers don't have to hand-interleave one themselves.
   */
  divider?: ReactNode;
  /** The content to stack. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
