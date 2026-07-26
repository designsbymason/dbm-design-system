import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { Responsive, SpaceValue } from "../../types/tokens";

/** A max-width step, matching the primitive breakpoint tokens, or `'full'` for no constraint. */
export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export type ContainerProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Max-width breakpoint step. `'full'` removes the max-width constraint.
   * @default 'xl'
   */
  size?: ContainerSize;
  /**
   * Horizontal padding (`padding-inline`), as a spacing token step — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   * @default 4
   */
  paddingInline?: Responsive<SpaceValue>;
  /** The content to center and constrain. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
