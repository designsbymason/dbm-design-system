import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * `default` is a left-bordered inline quote sized for body copy. `pull-quote`
 * is a larger, centered treatment with a decorative brand-colored quote mark,
 * for a standalone editorial callout rather than a quote embedded in running
 * text.
 */
export type BlockquoteVariant = "default" | "pull-quote";

export interface BlockquoteProps extends ComponentPropsWithoutRef<"blockquote"> {
  /** The quoted text content. */
  children: ReactNode;
  /**
   * Visual treatment.
   * @default 'default'
   */
  variant?: BlockquoteVariant;
  /**
   * Attribution rendered below the quote in a `<footer><cite>` (e.g. "Jane
   * Doe, CEO of Acme"), the semantic HTML pattern for quote attribution.
   */
  attribution?: ReactNode;
  /**
   * URL of the source the quote is from — the native `<blockquote>` `cite`
   * attribute. Not rendered visibly by browsers, but machine-readable
   * (search engines, screen-reader extensions that surface it) — pass
   * `attribution` too for a visible citation.
   */
  cite?: string;
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
}
