import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";

export type ListMarker = "disc" | "decimal" | "none";
export type ListElement = "ul" | "ol";

/** Native `<ol>` `type` values — the marker character an ordered list counts with. */
export type ListOrderedType = "1" | "a" | "A" | "i" | "I";

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
  /**
   * Native `<ol>` `start` — the ordinal value the first item counts from.
   * Only applies when `as="ol"`; has no effect on the default `ul` (warns
   * in development if passed without it).
   */
  start?: number;
  /**
   * Native `<ol>` `reversed` — counts items in descending order. Only
   * applies when `as="ol"`; has no effect on the default `ul` (warns in
   * development if passed without it).
   */
  reversed?: boolean;
  /**
   * The marker character to count with (`"1"`, `"a"`, `"A"`, `"i"`, `"I"`)
   * — translated internally into the matching CSS `list-style-type`
   * (`decimal`/`lower-alpha`/`upper-alpha`/`lower-roman`/`upper-roman`)
   * rather than left to the native `<ol type>` HTML attribute alone, since
   * CSS `list-style-type` always takes precedence over it when both are
   * present. Only applies when `as="ol"` and `marker` resolves to
   * `"decimal"` (the default for `ol`) — has no effect on the default
   * `ul`, or alongside an explicit `marker="disc"`/`"none"` override
   * (warns in development if passed without `as="ol"`).
   */
  type?: ListOrderedType;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * component, or a test/router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
