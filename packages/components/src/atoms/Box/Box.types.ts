import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export type BoxProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
