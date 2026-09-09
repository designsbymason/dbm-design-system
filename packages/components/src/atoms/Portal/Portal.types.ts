import type { PortalProps as RadixPortalProps } from "@radix-ui/react-portal";
import type { CSSProperties, ReactNode } from "react";

export interface PortalProps extends RadixPortalProps {
  /**
   * Element to portal children into. Ignored when `disablePortal` is true.
   * @default document.body
   */
  container?: Element | DocumentFragment | null;
  /**
   * The content to render into `container` (or in place, if `disablePortal`
   * is set). Must be a single valid element when `asChild` is set (Radix's
   * own `Slot` requirement, enforced at runtime); otherwise accepts any
   * number of children.
   */
  children: ReactNode;
  /**
   * Renders `children` in place, with no portal and no wrapper element,
   * instead of moving them to `container`. Useful for print views, tests
   * that need the DOM structure kept in place, or conditionally disabling
   * portaling without the consumer having to branch around whether
   * `<Portal>` is rendered at all. `ref`, `container`, `asChild`, and other
   * div props are ignored in this mode since there's no element left to
   * apply them to.
   * @default false
   */
  disablePortal?: boolean;
  /**
   * Portals the child itself instead of wrapping it in an extra `<div>` —
   * useful when `children` is already the element that should own the
   * portal's own root (avoiding a redundant nested `<div>`). Has no effect
   * when `disablePortal` is true.
   * @default false
   */
  asChild?: boolean;
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
