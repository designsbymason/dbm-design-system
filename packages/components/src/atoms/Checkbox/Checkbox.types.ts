import type { ComponentPropsWithoutRef, ReactNode } from "react";

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
   * Inline label rendered next to the checkbox. When omitted, provide an
   * `aria-label` instead (matches `IconButton`'s icon-only convention).
   */
  children?: ReactNode;
}
