import type { ComponentPropsWithoutRef, CSSProperties, RefObject } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button.types";

export interface BackToTopProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    // `onClick`: fully owned — always scrolls to top, not a raw passthrough.
    // `aria-hidden`/`tabIndex`: fully owned by the scroll-driven `visible`
    // state. `aria-label`: fully owned by `label` below, the one documented
    // naming mechanism. All three are computed automatically, not a raw
    // passthrough, so they're removed from the native extends entirely
    // rather than risk a consumer's direct value colliding with (and being
    // silently erased by) this component's own computed value. Same
    // pattern IconButton already established for its own `aria-pressed`.
    "onClick" | "aria-hidden" | "tabIndex" | "aria-label"
  > {
  /**
   * The underlying `IconButton`'s size.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * The underlying `IconButton`'s visual style.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Vertical scroll distance (px) past which the button becomes visible
   * and focusable. Measured against `scrollContainerRef`'s own `scrollTop`
   * when provided, or the page/viewport's `scrollY` otherwise.
   * @default 400
   */
  threshold?: number;
  /**
   * The scrollable container to watch and scroll, if not the page/viewport
   * itself — e.g. a modal body or dashboard panel with its own internal
   * scroll. Same prop name and shape as `Affix`'s own `scrollContainerRef`,
   * for consistency across the two scroll-aware atoms.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * Accessible label.
   * @default 'Back to top'
   */
  label?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * button, or a test/router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
