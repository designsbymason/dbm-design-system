import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export type CenterProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Renders `inline-flex` instead of `flex`, for centering within an
   * inline flow instead of as a block.
   * @default false
   */
  inline?: boolean;
  /** The content to center. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
