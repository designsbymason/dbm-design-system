import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";

export type { SpaceValue } from "@dbm-design-system/primitives";

export type StackDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify =
  "start" | "center" | "end" | "between" | "around" | "evenly";

export type StackProps<E extends ElementType = "div"> = {
  /**
   * The HTML element (or component) to render as.
   * @default 'div'
   */
  as?: E;
  /**
   * Flex direction of the stack — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g. `{ base: "column", md: "row" }`),
   * matching `Grid`'s `columns` prop.
   * @default 'column'
   */
  direction?: Responsive<StackDirection>;
  /**
   * Gap between children, as a spacing token step (e.g. `4` -> `var(--dbm-space-4)`) — a
   * single value, or a mobile-first responsive map keyed by breakpoint.
   * @default 0
   */
  gap?: Responsive<SpaceValue>;
  /**
   * `align-items` along the cross axis — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   * @default 'stretch'
   */
  align?: Responsive<StackAlign>;
  /**
   * `justify-content` along the main axis — a single value, or a mobile-first
   * responsive map keyed by breakpoint.
   * @default 'start'
   */
  justify?: Responsive<StackJustify>;
  /**
   * Whether children wrap onto new lines when they overflow the main axis —
   * a single value, or a mobile-first responsive map keyed by breakpoint.
   * @default false
   */
  wrap?: Responsive<boolean>;
  /**
   * An element (typically a `Divider`) automatically inserted between every
   * child, so consumers don't have to hand-interleave one themselves.
   */
  divider?: ReactNode;
  /** The content to stack. */
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
