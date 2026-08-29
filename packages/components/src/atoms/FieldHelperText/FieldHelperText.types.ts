import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export interface FieldHelperTextProps extends ComponentPropsWithoutRef<"p"> {
  /** The helper/hint text content. */
  children: ReactNode;
  /**
   * Dims the text to match a disabled field control.
   * @default false
   */
  disabled?: boolean;
  /**
   * Standard DOM id. Pair with the associated field control's own
   * `aria-describedby` so assistive tech announces this text as
   * describing that control.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
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
