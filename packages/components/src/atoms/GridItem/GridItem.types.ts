import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";
import type { Responsive } from "@dbm-design-system/primitives";

export type GridItemProps<E extends ElementType = "div"> = {
  /** The content to render inside the grid cell. */
  children?: ReactNode;
  /**
   * Number of columns this item spans — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g. `{ base: 4, md: 2 }`).
   */
  colSpan?: Responsive<number>;
  /**
   * Number of rows this item spans — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   */
  rowSpan?: Responsive<number>;
  /**
   * Explicit starting column line (1-indexed, per the CSS Grid spec) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   */
  colStart?: Responsive<number>;
  /**
   * Explicit starting row line (1-indexed, per the CSS Grid spec) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   */
  rowStart?: Responsive<number>;
  /**
   * Visual reordering (CSS `order`), independent of DOM/source order — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   * Unset by default (source order applies, CSS `order`'s own initial
   * value of `0`).
   */
  order?: Responsive<number>;
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
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
