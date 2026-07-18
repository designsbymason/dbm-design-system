import type { ComponentPropsWithoutRef } from "react";

/** A spacing scale step, matching the primitive spacing token steps. */
export type SpaceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;

export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Flex direction of the stack.
   * @default 'column'
   */
  direction?: "row" | "column";
  /**
   * Gap between children, as a spacing token step (e.g. `4` -> `var(--dbm-space-4)`).
   * @default 0
   */
  gap?: SpaceValue;
  /**
   * `align-items` along the cross axis.
   * @default 'stretch'
   */
  align?: StackAlign;
  /**
   * `justify-content` along the main axis.
   * @default 'start'
   */
  justify?: StackJustify;
  /**
   * Whether children wrap onto new lines when they overflow the main axis.
   * @default false
   */
  wrap?: boolean;
}
