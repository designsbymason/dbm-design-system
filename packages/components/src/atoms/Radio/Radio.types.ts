import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type RadioSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface RadioProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "checked" | "defaultChecked" | "onChange" | "disabled" | "value"
  > {
  /**
   * Inline label rendered next to the radio. When omitted, provide an
   * `aria-label` instead (matches `Checkbox`'s own icon-only convention).
   */
  children?: ReactNode;
  /**
   * Inside a `RadioGroup`, omitting this inherits the group's own `size`
   * (if it set one) instead of falling straight to the default — an
   * explicit value here always wins over both. Standalone, or grouped with
   * no inherited size either, falls back to `'md'`.
   * @default 'md'
   */
  size?: RadioSize;
  /**
   * Marks the radio as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Standalone controlled checked state — only meaningful when this `Radio`
   * has no `RadioGroup` ancestor. Inside a `RadioGroup`, the group's own
   * `value`/`defaultValue`/`onValueChange` fully controls which item is
   * checked instead; passing this there has no effect and warns once in
   * development. Unlike `Checkbox`, clicking an already-checked `Radio`
   * never unchecks it — that matches real radio-button semantics (a lone
   * radio, same as a grouped one, can't be turned off by clicking itself
   * again). Set `checked={false}` from your own state to uncheck it
   * programmatically.
   */
  checked?: boolean;
  /** The initial checked state when uncontrolled and standalone. */
  defaultChecked?: boolean;
  /**
   * Called when a standalone `Radio` becomes checked. Only ever called with
   * `true` — see `checked`'s own doc for why a `Radio` can't self-uncheck.
   * Not called inside a `RadioGroup`; use the group's own `onValueChange`
   * there instead.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Disables the radio natively. Redeclared explicitly (native `<button>`
   * already has this) so it's positioned correctly in the rendered
   * Properties table and Storybook Controls panel, matching this
   * component's own intended prop order.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks a standalone radio as required for HTML5 form validation, and
   * sets `aria-required`. Only meaningful standalone (applies to this
   * `Radio`'s own private single-item group) — ignored, with a dev-mode
   * warning, inside a `RadioGroup`, which owns group-level `required`
   * instead.
   * @default false
   */
  required?: boolean;
  /**
   * Focuses the radio automatically on mount. Use sparingly — stealing
   * focus on page load is disorienting for screen-reader/keyboard users
   * unless this radio is genuinely the page's primary action.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Form field name. Only meaningful standalone, inside a `<form>` — Radix
   * renders a hidden native `<input type="radio">` there for real form
   * submission. Ignored, with a dev-mode warning, inside a `RadioGroup`,
   * which owns `name` for the whole group instead.
   */
  name?: string;
  /**
   * This radio's own value. **Required, in practice, inside a
   * `RadioGroup`** — it's what identifies this option among its siblings;
   * two `Radio`s in the same group with the same (or no) `value` can't be
   * told apart. Standalone, it's optional and only matters for real
   * `<form>` submission (same role as `Checkbox`'s own `value`) — defaults
   * to `"on"`, matching a native `<input type="radio">` with no explicit
   * `value`.
   */
  value?: string;
  /**
   * Associates a standalone radio with a `<form>` by `id`, for use outside
   * that form's own DOM subtree — same purpose as the native `form`
   * attribute. Ignored, with a dev-mode warning, inside a `RadioGroup`.
   */
  form?: string;
  /**
   * Accessible label announced by assistive tech when there's no visible
   * `children` label.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly — when omitted, `Radio`
   * generates one internally (via `useId`) to associate its own inline
   * `children` label via `htmlFor`.
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
   * `data-testid` attribute on the radio control itself; has no visual or
   * behavioral effect.
   */
  "data-testid"?: string;
}
