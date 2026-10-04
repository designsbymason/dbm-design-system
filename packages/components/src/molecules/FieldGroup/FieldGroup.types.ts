import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";
import type { FieldLabelSize } from "../../atoms/FieldLabel";

/** How the group draws itself: no box, a border, or a tinted fill. */
export type FieldGroupVariant = "ghost" | "outlined" | "filled";

/** Whether the group's fields are stacked or sit side by side (wrapping when they run out of room). */
export type FieldGroupOrientation = "vertical" | "horizontal";

export interface FieldGroupProps
  extends Omit<ComponentPropsWithoutRef<"fieldset">, "children"> {
  /**
   * The group's visible name, rendered as the `<legend>` of a native `<fieldset>`, so assistive tech announces
   * it ahead of every field inside ("Shipping address, group").
   */
  legend: ReactNode;
  /** The fields in the group — usually `FormField`s. */
  children?: ReactNode;
  /**
   * Supplementary text under the legend, rendered via `FieldHelperText`, and described to assistive tech
   * through the group's `aria-describedby`.
   */
  description?: ReactNode;
  /**
   * An error about the group as a whole (an "at least one of these" rule, a mismatch between two fields),
   * rendered via `FieldError` below the fields. Its presence marks the group invalid; each field's own `error`
   * stays on that field.
   */
  error?: ReactNode;
  /**
   * Keeps the legend for assistive tech and removes it from the page — for a group whose purpose is clear from
   * the surrounding heading.
   * @default false
   */
  hideLegend?: boolean;
  /**
   * How the group draws itself: `ghost` (no box), `outlined` (a border) or `filled` (a tinted fill).
   * @default 'ghost'
   */
  variant?: FieldGroupVariant;
  /**
   * Font size of the legend, and the default `size` of every `FormField` inside, which can still set its own.
   * @default 'md'
   */
  size?: FieldLabelSize;
  /**
   * `vertical` stacks the fields; `horizontal` puts them side by side and wraps the next onto its own line
   * when a field would be narrower than a usable width. Takes a breakpoint map.
   * @default 'vertical'
   */
  orientation?: Responsive<FieldGroupOrientation>;
  /**
   * The space between fields, as a step on the spacing scale.
   * @default 4
   */
  gap?: SpaceValue;
  /**
   * Disables the whole group: the native `<fieldset disabled>` disables every native control inside, each
   * `FormField` inside is dimmed and disabled too, and a nested group inherits it.
   * @default false
   */
  disabled?: boolean;
  /** Overrides the auto-generated base id used for the description's and error's own ids. */
  id?: string;
  /** Additional CSS classes for the `<fieldset>`. */
  className?: string;
  /** Inline styles for the `<fieldset>`. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
  /** Extra ids of elements that also describe the group, joined to the description's and error's own. */
  "aria-describedby"?: string;
}
