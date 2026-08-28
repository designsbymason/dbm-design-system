import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export interface FieldErrorProps extends ComponentPropsWithoutRef<"p"> {
  /** The error message content. */
  children: ReactNode;
  /**
   * Shows a small warning icon before the message. `false` hides it
   * entirely; a component reference overrides the glyph (matches
   * `Checkbox`'s/`ListItem`'s own `icon` override convention) — override
   * sparingly, since this icon is a fixed semantic signal ("this is an
   * error"), not a stylistic marker, and per-instance drift here works
   * against a consistent error-state language across the system.
   * @default true
   */
  icon?: boolean | PhosphorIcon;
  /**
   * Dims the text (and icon, via `currentColor`) to match a disabled field
   * control — matches `FieldLabel`'s and `FieldHelperText`'s own identical
   * prop.
   * @default false
   */
  disabled?: boolean;
  /**
   * Standard DOM id. Pair with the associated field control's own
   * `aria-describedby` so assistive tech announces this message as
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
