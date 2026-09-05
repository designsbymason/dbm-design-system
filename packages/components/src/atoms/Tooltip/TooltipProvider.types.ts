import type { ReactNode } from "react";

export interface TooltipProviderProps {
  /**
   * Every `Tooltip` rendered anywhere inside this subtree shares its
   * hover-delay/skip-delay timing and `disableHoverableContent` default,
   * unless a given `Tooltip` sets its own.
   */
  children: ReactNode;
  /**
   * Milliseconds the trigger must be hovered/focused before a `Tooltip` in
   * this subtree opens — the shared default every `Tooltip` inherits
   * unless it sets its own `delayDuration`.
   * @default 400
   */
  delayDuration?: number;
  /**
   * Milliseconds after closing one tooltip in this subtree during which
   * opening another skips `delayDuration` entirely. This is what makes
   * quickly moving the pointer between several tooltipped elements (a
   * toolbar of icon buttons, say) feel instant after the first one opens,
   * instead of re-incurring the full delay every time — the actual
   * behavior a standalone `Tooltip` (no ambient `TooltipProvider`) can
   * never provide on its own, since each one manages its own isolated
   * timing with no other tooltip to skip a delay relative to.
   * @default 300
   */
  skipDelayDuration?: number;
  /**
   * Default `disableHoverableContent` for every `Tooltip` in this
   * subtree, unless a given `Tooltip` sets its own.
   * @default false
   */
  disableHoverableContent?: boolean;
}
