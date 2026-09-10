import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/** A v1 brand palette. */
export type Brand = "purple" | "emerald";

/** A color mode. `'system'` follows the OS preference via `prefers-color-scheme`. */
export type ColorMode = "light" | "dark" | "system";

export interface ThemeProviderProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Which brand palette to apply.
   * @default 'purple'
   */
  brand?: Brand;
  /**
   * Which color mode to apply. `'system'` follows `prefers-color-scheme` and
   * updates live if the OS preference changes while mounted.
   * @default 'system'
   */
  mode?: ColorMode;
  /** The subtree to render inside the theme wrapper. */
  children: ReactNode;
  /**
   * Standard DOM id, applied to the wrapper element. Needed when another
   * element's aria-labelledby/aria-describedby must point at this
   * component, or a test/router needs a stable anchor. The wrapper itself
   * renders `display: contents` (see the component's own JSDoc), so this
   * never participates in layout.
   */
  id?: string;
  /** Additional CSS classes for customization, applied to the wrapper element. */
  className?: string;
  /** Inline styles, merged onto the wrapper element's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * getByTestId, Playwright/Cypress selectors), applied to the wrapper
   * element. Has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
