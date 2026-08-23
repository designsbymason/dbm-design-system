import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type CheckboxSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface CheckboxProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "checked" | "defaultChecked" | "onChange"
  > {
  /** @default 'md' */
  size?: CheckboxSize;
  /**
   * Marks the checkbox as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * The controlled checked state. `"indeterminate"` renders a dash instead
   * of a checkmark — a purely visual/semantic state you set explicitly
   * (e.g. "some but not all children selected"); clicking always toggles
   * between `true`/`false`, never back to `"indeterminate"` on its own.
   */
  checked?: boolean | "indeterminate";
  /** The initial checked state when uncontrolled. */
  defaultChecked?: boolean | "indeterminate";
  /** Called with the new checked state whenever it changes. */
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  /**
   * Marks the checkbox as required for HTML5 form validation, and sets
   * `aria-required`. Native `<button>` has no `required` attribute of its
   * own — this is a Radix Checkbox primitive feature, forwarded straight
   * through, not something DBM adds on top.
   * @default false
   */
  required?: boolean;
  /**
   * Form field name. Only meaningful inside a `<form>` — Radix Checkbox
   * automatically renders a hidden native `<input type="checkbox">` there
   * so the checkbox participates in real form submission (including
   * uncontrolled forms with no JS handler), and `name` is what that hidden
   * input submits under.
   */
  name?: string;
  /**
   * Form field value, submitted by the hidden native input (see `name`)
   * when checked. Defaults to `"on"`, matching a native
   * `<input type="checkbox">` with no explicit `value`.
   */
  value?: string;
  /**
   * Associates the checkbox with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   */
  form?: string;
  /**
   * Overrides the glyph shown when checked — a component reference, not a
   * string name. Defaults to the system's own check glyph; override
   * sparingly, since a non-standard glyph works against the cross-product
   * visual consistency a shared checkbox is meant to provide.
   * @default CheckIcon
   */
  icon?: PhosphorIcon;
  /**
   * Overrides the glyph shown when `checked`/`defaultChecked` is
   * `"indeterminate"` — a component reference, not a string name. Defaults
   * to the system's own dash glyph; see `icon`'s own doc for the same
   * consistency caveat.
   * @default MinusIcon
   */
  indeterminateIcon?: PhosphorIcon;
  /**
   * Inline label rendered next to the checkbox. When omitted, provide an
   * `aria-label` instead (matches `IconButton`'s icon-only convention).
   */
  children?: ReactNode;
  /**
   * Accessible label announced by assistive tech when there's no visible
   * `children` label. Required for icon-only/label-less usage — see the
   * component's own JSDoc example.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead. Use instead of `aria-label` when that
   * visible element's text is the better accessible name; use `aria-label`
   * when no such element exists.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly — when omitted, Checkbox
   * generates one internally (via `useId`) to associate its own inline
   * `children` label via `htmlFor`. Pass one explicitly when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * checkbox, or when a test or router needs a stable, predictable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them. Applies to the
   * checkbox control itself, not the outer label wrapper (when `children`
   * is set).
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   * Applies to the checkbox control itself, not the outer label wrapper
   * (when `children` is set).
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the checkbox control itself; has no visual
   * or behavioral effect.
   */
  "data-testid"?: string;
}
