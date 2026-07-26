import type { ComponentPropsWithoutRef, ReactNode } from "react";

// Reuses exactly Badge's already contrast-verified "subtle" tone pairings
// (bg.{tone}-subtle + text.{tone}) rather than introducing a new one —
// "neutral"/"brand" aren't included since neither has a subtle-background
// pairing verified anywhere yet, and a highlight specifically needs one.
export type HighlightTone = "warning" | "success" | "info" | "danger";

export interface HighlightProps extends ComponentPropsWithoutRef<"mark"> {
  /**
   * @default 'warning'
   */
  tone?: HighlightTone;
  children: ReactNode;
}
