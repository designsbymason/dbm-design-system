import type { ComponentPropsWithoutRef } from "react";

/** A max-width step, matching the primitive breakpoint tokens, or `'full'` for no constraint. */
export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Max-width breakpoint step. `'full'` removes the max-width constraint.
   * @default 'xl'
   */
  size?: ContainerSize;
}
