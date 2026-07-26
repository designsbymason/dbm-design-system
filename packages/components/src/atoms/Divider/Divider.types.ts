import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Responsive } from "../../types/tokens";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed";

export interface DividerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * Axis the divider runs along — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g.
   * `{ base: "horizontal", lg: "vertical" }`).
   * @default 'horizontal'
   */
  orientation?: Responsive<DividerOrientation>;
  /**
   * Line style.
   * @default 'solid'
   */
  variant?: DividerVariant;
  /**
   * Optional centered label (e.g. `"OR"`). When set, the divider renders as
   * two line segments flanking the label instead of one continuous line.
   */
  label?: ReactNode;
}
