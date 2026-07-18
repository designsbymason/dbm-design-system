import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;
  /**
   * Optional centered label (e.g. `"OR"`). When set, the divider renders as
   * two line segments flanking the label instead of one continuous line.
   */
  label?: ReactNode;
}
