import type { ComponentPropsWithoutRef } from "react";

export interface IndicatorsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Total number of slides/steps. */
  count: number;
  /** The controlled active index. */
  activeIndex: number;
  /** Called when a dot is activated — by click, or Arrow/Home/End keys. */
  onIndexChange: (index: number) => void;
  /**
   * Accessible label per dot.
   * @default (index) => `Go to slide ${index + 1}`
   */
  getLabel?: (index: number) => string;
}
