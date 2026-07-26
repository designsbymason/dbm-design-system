import type { ComponentPropsWithoutRef } from "react";
import type { IconTone } from "../Icon";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends ComponentPropsWithoutRef<"span"> {
  /** @default 'md' */
  size?: SpinnerSize;
  /**
   * Color, from the same scale `Icon`'s `tone` uses. Defaults to
   * inheriting `currentColor` from context (e.g. a colored button or
   * banner) rather than a fixed tone.
   */
  tone?: IconTone;
  /**
   * Accessible label announced to assistive tech (e.g. `"Loading"`).
   * Decorative (`aria-hidden`) and silent to screen readers when omitted —
   * pair with a visible loading message elsewhere, or set this, so the
   * loading state isn't invisible to assistive tech.
   */
  label?: string;
}
