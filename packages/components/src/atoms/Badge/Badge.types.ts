import type { ComponentPropsWithoutRef } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * @default 'neutral'
   */
  tone?: BadgeTone;
}
