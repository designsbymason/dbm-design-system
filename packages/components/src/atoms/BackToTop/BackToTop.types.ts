import type { ComponentPropsWithoutRef } from "react";

export interface BackToTopProps
  extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
  /**
   * Vertical scroll distance (px) past which the button becomes visible
   * and focusable.
   * @default 400
   */
  threshold?: number;
  /**
   * Accessible label.
   * @default 'Back to top'
   */
  label?: string;
}
