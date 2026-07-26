import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Responsive, SpaceValue } from "../../types/tokens";

export type ListMarker = "disc" | "decimal" | "none";
export type ListElement = "ul" | "ol";

export type ListProps<E extends ListElement = "ul"> = {
  /**
   * The list element to render.
   * @default 'ul'
   */
  as?: E;
  /**
   * Marker style. Defaults to `'disc'` for `ul` and `'decimal'` for `ol`.
   */
  marker?: ListMarker;
  /**
   * Vertical gap between items, as a spacing token step — a single value,
   * or a mobile-first responsive map keyed by breakpoint.
   * @default 2
   */
  spacing?: Responsive<SpaceValue>;
  /** The list items (typically `ListItem`). */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
