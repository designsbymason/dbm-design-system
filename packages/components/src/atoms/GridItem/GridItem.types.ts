import type { ComponentPropsWithoutRef } from "react";

export interface GridItemProps extends ComponentPropsWithoutRef<"div"> {
  /** Number of columns this item spans. */
  colSpan?: number;
  /** Number of rows this item spans. */
  rowSpan?: number;
  /** Explicit starting column line (1-indexed, per the CSS Grid spec). */
  colStart?: number;
  /** Explicit starting row line (1-indexed, per the CSS Grid spec). */
  rowStart?: number;
}
