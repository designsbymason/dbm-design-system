import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type FieldLabelSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface FieldLabelProps extends ComponentPropsWithoutRef<"label"> {
  /** The label text. */
  children: ReactNode;
  /**
   * The id of the field control this label describes — pairs via the
   * native label/control association. Omit and wrap the control as a
   * child instead when an explicit id isn't otherwise needed.
   */
  htmlFor?: string;
  /**
   * Font size, matching the size scale of the field control it labels
   * (`Input`, `Textarea`, `Select`, etc.).
   * @default 'md'
   */
  size?: FieldLabelSize;
  /**
   * Shows a decorative required-indicator asterisk after the label text.
   * Purely visual — hidden from assistive tech (`aria-hidden`), since the
   * associated control's own `required`/`aria-required` attribute is what
   * actually conveys that semantics.
   * @default false
   */
  required?: boolean;
  /**
   * Dims the label to match a disabled field control.
   * @default false
   */
  disabled?: boolean;
  /** Standard DOM id. */
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
