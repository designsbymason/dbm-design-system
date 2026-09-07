import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export interface KbdProps extends ComponentPropsWithoutRef<"kbd"> {
  /** The key name or symbol to display (e.g. `"Esc"`, `"K"`, `"⌘"`). */
  children: ReactNode;
  /**
   * An accessible label for symbol-only content. Unicode key glyphs (`⌘`,
   * `⇧`, `⌥`, `⌃`) aren't reliably announced by screen readers on their own
   * — pass a plain-language name (e.g. `aria-label="Command"` for `⌘`) so
   * assistive tech announces something meaningful instead of the raw
   * character or nothing at all. Not needed when `children` is already a
   * readable word (`"Esc"`, `"Enter"`).
   */
  "aria-label"?: string;
  /**
   * Standard DOM id. Needed when another element's `aria-labelledby`/
   * `aria-describedby` must point at this component, or a test/router
   * needs a stable anchor.
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
