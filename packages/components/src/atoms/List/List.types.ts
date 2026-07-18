import type { ComponentPropsWithoutRef } from "react";
import type { SpaceValue } from "../Stack/Stack.types";

export type ListMarker = "disc" | "decimal" | "none";

export interface ListProps extends ComponentPropsWithoutRef<"ul"> {
  /**
   * @default 'ul'
   */
  as?: "ul" | "ol";
  /**
   * Marker style. Defaults to `'disc'` for `ul` and `'decimal'` for `ol`.
   */
  marker?: ListMarker;
  /**
   * Vertical gap between items, as a spacing token step.
   * @default 2
   */
  spacing?: SpaceValue;
}
