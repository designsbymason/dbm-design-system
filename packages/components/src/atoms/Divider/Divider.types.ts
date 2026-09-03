import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive } from "@dbm-design-system/primitives";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed" | "dotted" | "double";
export type DividerThickness = "thin" | "regular" | "thick";
export type DividerEmphasis = "none" | "start" | "end";
export type DividerTone =
  | "default"
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";
export type DividerAlign = "start" | "center" | "end";

export interface DividerProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  /**
   * Axis the divider runs along — a single value, or a mobile-first
   * responsive map keyed by breakpoint (e.g.
   * `{ base: "horizontal", lg: "vertical" }`).
   * @default 'horizontal'
   */
  orientation?: Responsive<DividerOrientation>;
  /**
   * Line style — `double` renders two parallel lines instead of one; pair
   * it with `emphasis` to make one of the two heavier.
   * @default 'solid'
   */
  variant?: DividerVariant;
  /**
   * Base stroke weight, applied to every variant — the single line's weight
   * for `solid`/`dashed`/`dotted`, and the default (non-emphasized) weight
   * for `double`'s two parallel lines. `emphasis` steps one line up from
   * this base rather than using a fixed absolute weight, so the pairing
   * still scales together.
   * @default 'thin'
   */
  thickness?: DividerThickness;
  /**
   * Which of `double`'s two parallel lines (if either) is heavier — logical
   * (RTL-aware), matching `align`'s own `start`/`end` convention. The
   * emphasized line steps up one level from `thickness` (capped at
   * `'thick'`); the other renders at `thickness`. Has no effect on any
   * other `variant`.
   * @default 'none'
   */
  emphasis?: DividerEmphasis;
  /**
   * Semantic color — every variant's line color, constrained to this
   * system's `border.*` token family rather than an arbitrary CSS color
   * (matching `Badge`/`Tag`/`ProgressBar`'s own `tone` prop convention).
   * `default` is `Divider`'s original, dedicated resting color
   * (`border.default`) — distinct from the generic gray `border.neutral`
   * used elsewhere, so this doesn't shift existing usage's appearance.
   * @default 'default'
   */
  tone?: DividerTone;
  /**
   * Optional centered label (e.g. `"OR"`). When set, the divider renders as
   * two line segments flanking the label instead of one continuous line.
   */
  label?: ReactNode;
  /**
   * Where the label sits along the line, logical (RTL-aware) rather than
   * physical left/right. Only meaningful when `label` is set — has no
   * effect otherwise.
   * @default 'center'
   */
  align?: DividerAlign;
  /**
   * Accessible name override. When `label` is a plain string and this
   * isn't set (or is an empty string), it's used automatically as the
   * fallback accessible name — pass a non-empty string to override that, or
   * when `label` is a non-string `ReactNode` a fallback can't be derived
   * from automatically.
   */
  "aria-label"?: string;
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
