import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export interface AspectRatioProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Width divided by height (e.g. `16 / 9`, `1` for square, `4 / 3`). Must
   * be a positive, finite number — an invalid value is ignored by the
   * browser (the box falls back to its content's own intrinsic size) and
   * logs a development-mode warning.
   * @default 16 / 9
   */
  ratio?: number;
  /**
   * The content to lock to the aspect ratio — typically an image, iframe,
   * or video stretched to fill the box (`width: 100%; height: 100%`, plus
   * `objectFit: 'cover'` for images/video). Renders inside an
   * `overflow: hidden` wrapper, so oversized content is clipped rather than
   * breaking the ratio.
   */
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
   * Inline styles, merged onto the component's own internal styles. Applied
   * *after* the computed `aspectRatio` value, so a `style.aspectRatio`
   * passed here deliberately overrides the `ratio` prop if both are set.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
