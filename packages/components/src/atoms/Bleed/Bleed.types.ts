import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type BleedSide = "inline" | "block" | "all";

export interface BleedProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * How far to bleed — matching the parent's own padding you're
   * counteracting (e.g. a `Container` padded with `space-6` needs
   * `inset={6}` to bleed its content back out to the viewport edge).
   * Accepts a single spacing step, or a mobile-first responsive map keyed
   * by breakpoint (e.g. `{ base: 4, lg: 8 }`) — matching `Container`'s own
   * `paddingInline`, the prop this is most often counteracting, which
   * supports the identical responsive shape. A breakpoint omitted from the
   * map bleeds by `0` (no bleed) at that width, until the next breakpoint
   * up that does specify a value.
   * No default: an arbitrary value would silently bleed the wrong amount
   * for whatever padding is actually on the parent.
   */
  inset: Responsive<SpaceValue>;
  /**
   * Which axis to bleed on.
   * @default 'inline'
   */
  side?: BleedSide;
  /** The content to bleed out of the parent's padding. */
  children: ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * component, or a test/router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles. Applied via the standard CSS cascade — inline styles
   * beat stylesheet rules — so a caller's own margin longhand (matching
   * whichever ones `side` computes) wins over the bleed margin if both
   * target the same property; no special merge logic involved.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
