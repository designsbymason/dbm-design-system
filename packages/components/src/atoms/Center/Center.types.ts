import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";

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
