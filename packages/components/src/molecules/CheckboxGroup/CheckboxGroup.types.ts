import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { CheckboxSize } from "../../atoms/Checkbox";

export type CheckboxGroupOrientation = "horizontal" | "vertical";

export interface CheckboxGroupProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "defaultValue" | "onChange" | "children"
  > {
  /** The `Checkbox` elements this group manages — each needs its own `value`. */
  children: ReactNode;
  /**
   * Sets the size every `Checkbox` in this group inherits, unless a
   * `Checkbox` sets its own `size` explicitly (which always wins). Leaving
   * this unset means each `Checkbox` falls back to its own default
   * (`'md'`) individually, exactly as if there were no group `size` at
   * all.
   */
  size?: CheckboxSize;
  /**
   * The controlled array of checked values. Pass `[]` to represent
   * "nothing checked" in a controlled group — omitting `value` entirely
   * (leaving it `undefined`) is what makes the group uncontrolled instead,
   * deferring to `defaultValue`.
   */
  value?: string[];
  /** The initial checked values when uncontrolled. */
  defaultValue?: string[];
  /** Called with the full, newly-updated array of checked values whenever any item's checked state changes. */
  onValueChange?: (value: string[]) => void;
  /**
   * Marks the group as invalid: shows a colored left-border accent (same
   * visual treatment as `RadioGroup`'s own `hasError` — a bare group of
   * options has no bounded box of its own for a full border to live on).
   * Unlike `RadioGroup` (`role="radiogroup"`, which the ARIA spec lists as
   * supporting `aria-invalid`), this renders `role="group"`, which does
   * not — there's no ARIA-valid way to flag a plain group itself as
   * invalid, so this is a visual-only signal. Always pair it with a nearby
   * `FieldError` so the reason is still available to assistive tech, not
   * just sighted users.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables every `Checkbox` in the group at once — each still accepts
   * its own additional `disabled` on top of this (the two OR together).
   * @default false
   */
  disabled?: boolean;
  /**
   * Form field name shared by every `Checkbox` in the group that doesn't
   * set its own — only meaningful inside a `<form>`. Unlike
   * `RadioGroup`'s own `name` (which Radix's radio primitive reserves
   * exclusively for the group Root), this cascades the same way a
   * `Checkbox`'s own `name` does: each grouped `Checkbox` still renders its
   * own independent hidden native input, and sharing one `name` across all
   * of them is what makes the group submit as a real native checkbox
   * group (`?interests=sports&interests=music`).
   */
  name?: string;
  /**
   * Associates the group with a `<form>` by `id`, for use outside that
   * form's own DOM subtree — same purpose as the native `form` attribute.
   * Cascades to every `Checkbox` the same way `name` does.
   */
  form?: string;
  /**
   * Purely visual layout direction — stacks options in a column or flows
   * them in a wrapping row. Unlike `RadioGroup`'s own `orientation`, this
   * has no keyboard-navigation behavior attached: a set of checkboxes has
   * no single composite tab stop or arrow-key roving focus in the WAI-ARIA
   * sense (each `Checkbox` stays independently focusable via `Tab`, the
   * same as if there were no group at all) — `orientation` here only ever
   * changes `flex-direction`.
   * @default 'vertical'
   */
  orientation?: CheckboxGroupOrientation;
  /**
   * Accessible name for the group — every `role="group"` benefits from
   * one so assistive tech announces what this set of options represents.
   * Required unless `aria-labelledby` points at a visible heading/label
   * instead (a dev-mode warning fires if neither is set).
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element (e.g. a
   * `FieldLabel`) to use as the group's accessible name instead of
   * `aria-label`.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * group, or a test/router needs a stable anchor.
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
