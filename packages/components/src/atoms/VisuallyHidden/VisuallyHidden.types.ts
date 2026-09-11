import type { VisuallyHiddenProps as RadixVisuallyHiddenProps } from "@radix-ui/react-visually-hidden";
import type { CSSProperties, ReactNode } from "react";

export interface VisuallyHiddenProps extends RadixVisuallyHiddenProps {
  /** The content to visually hide (while keeping it in the accessibility tree). */
  children: ReactNode;
  /**
   * Keeps the content visually hidden by default, but reveals it in normal
   * document flow when it (or a focusable descendant) receives focus — the
   * classic "skip link" pattern: hidden for mouse/screen-reader users,
   * visible the moment a sighted keyboard user tabs to it. Matches
   * react-aria's own `isFocusable` for this same pattern.
   * Revealing only restores normal layout flow — it adds no background,
   * positioning, or chrome of its own, so style the revealed state yourself
   * if it needs to stand out (e.g. a real skip link).
   * @default false
   */
  focusable?: boolean;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<span>` (via Radix `Slot`) — applies the hidden styling directly to
   * the child. `children` must be a single valid element when set.
   * @default false
   */
  asChild?: boolean;
  /**
   * Standard DOM id. Needed when another element's aria-labelledby/
   * aria-describedby must point at this component, or a test/router needs
   * a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal hidden styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * getByTestId, Playwright/Cypress selectors). Rendered as the DOM
   * data-testid attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
