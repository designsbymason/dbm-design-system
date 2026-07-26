import type { ComponentPropsWithoutRef } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type BadgeVariant = "subtle" | "solid";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * @default 'neutral'
   */
  tone?: BadgeTone;
  /**
   * @default 'subtle'
   */
  variant?: BadgeVariant;
  /**
   * When `children` is a number greater than `max`, displays `${max}+`
   * instead — e.g. `max={99}` renders "99+" for a count of 100. Has no
   * effect when `children` isn't a number, or `dot` is set.
   */
  max?: number;
  /**
   * Renders as a minimal dot with no visible text or count — for a plain
   * "has updates" indicator, typically placed next to an already-labeled
   * element (e.g. an icon). Decorative (`aria-hidden`) unless an explicit
   * `aria-label`/`aria-labelledby` is supplied.
   * @default false
   */
  dot?: boolean;
}
