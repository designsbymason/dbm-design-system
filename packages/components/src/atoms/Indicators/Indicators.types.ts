import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type IndicatorsSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IndicatorsOrientation = "horizontal" | "vertical";
export type IndicatorsVariant = "dots" | "outline" | "bars";

export interface IndicatorsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Total number of slides/steps. */
  count: number;
  /**
   * Dot diameter. The active dot's pill elongates along the layout axis
   * (see `orientation`) by a fixed 3x multiple of the diameter at every
   * step, matching the original 8px/24px `md` ratio.
   * @default 'md'
   */
  size?: IndicatorsSize;
  /**
   * Layout axis. `horizontal` renders a row with Left/Right arrow-key
   * navigation (the default); `vertical` renders a column with Up/Down
   * arrow-key navigation instead. `Home`/`End` jump to the first/last dot
   * regardless of orientation.
   * @default 'horizontal'
   */
  orientation?: IndicatorsOrientation;
  /**
   * Visual style. `dots` (the default) is a solid-filled circle per step;
   * `outline` renders inactive steps as a hollow ring instead of a solid
   * fill, with the active step staying solid for contrast; `bars` renders
   * every step at the same length (no active-step elongation — see
   * `size`), with the active step at full thickness and every inactive
   * step at half that, on top of the fill-color difference — matching the
   * segmented-progress look of Stories-style UIs.
   * @default 'dots'
   */
  variant?: IndicatorsVariant;
  /** The controlled active index. */
  activeIndex: number;
  /** Called when a dot is activated — by click, or Arrow/Home/End keys. */
  onIndexChange: (index: number) => void;
  /**
   * Accessible label per dot.
   * @default (index) => `Go to slide ${index + 1}`
   */
  getLabel?: (index: number) => string;
  /**
   * Shows a text progress label (e.g. "3/5") next to the dots, reflecting
   * `activeIndex`/`count`. Defaults to hidden — the dots alone are the
   * primary UI; this is an optional, purely visual supplement.
   * @default false
   */
  showLabel?: boolean;
  /**
   * Customizes the progress label's content shown when `showLabel` is set
   * — receives the current `activeIndex` and `count`, returns the content
   * to render. Defaults to `` `${activeIndex + 1}/${count}` `` (e.g.
   * `"3/5"`). Has no effect unless `showLabel` is also set — development
   * mode warns once if it's provided without it.
   */
  formatLabel?: (activeIndex: number, count: number) => ReactNode;
  /**
   * Accessible name for the whole group of dots.
   * @default 'Slide navigation'
   */
  "aria-label"?: string;
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
