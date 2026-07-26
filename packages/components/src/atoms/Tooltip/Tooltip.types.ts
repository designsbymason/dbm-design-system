import type { ReactElement, ReactNode } from "react";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps {
  /** The tooltip's content. */
  content: ReactNode;
  /**
   * The trigger — a single element that accepts a ref (via Radix `Slot`
   * composition), matching this system's `asChild` convention elsewhere.
   */
  children: ReactElement;
  /** @default 'top' */
  side?: TooltipSide;
  /** @default 'center' */
  align?: TooltipAlign;
  /**
   * Milliseconds the trigger must be hovered/focused before the tooltip
   * opens.
   * @default 400
   */
  delayDuration?: number;
  /** The controlled open state. */
  open?: boolean;
  /** The initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
