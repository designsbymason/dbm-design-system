import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface AspectRatioProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Width divided by height (e.g. `16 / 9`, `1` for square, `4 / 3`).
   * @default 16 / 9
   */
  ratio?: number;
  children: ReactNode;
}
