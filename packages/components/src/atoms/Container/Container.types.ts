import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";
import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";

/** A max-width step, matching the primitive breakpoint tokens, or `'full'` for no constraint. */
export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export type ContainerProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Max-width breakpoint step. `'full'` removes the max-width constraint.
   * @default 'xl'
   */
  size?: ContainerSize;
  /**
   * Horizontal padding (`padding-inline`), as a spacing token step — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   * @default 4
   */
  paddingInline?: Responsive<SpaceValue>;
  /** The content to center and constrain. */
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
