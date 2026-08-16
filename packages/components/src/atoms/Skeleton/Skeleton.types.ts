import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export type SkeletonVariant = "text" | "circular" | "rectangular";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  /**
   * Shape of the placeholder — `text` for inline text lines (sits at 1em
   * tall, matching a line of body text), `circular` for avatars/icons, or
   * `rectangular` for images, cards, and other larger blocks. `rectangular`
   * always carries a soft corner radius, matching this system's house
   * corner-radius style — there's no separate sharp-cornered option.
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /** Width — any valid CSS width value (e.g. `'100%'`, `'4rem'`, `120`). */
  width?: string | number;
  /** Height — any valid CSS height value. */
  height?: string | number;
  /**
   * `'none'` always renders statically — same as the automatic
   * `prefers-reduced-motion` override, but chosen deliberately (e.g. for a
   * dense table where many simultaneous animations would be distracting).
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;
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
