import type { ComponentPropsWithoutRef } from "react";
import type { IconSize } from "../Icon";

export type CloseButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface CloseButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** @default 'md' */
  size?: CloseButtonSize;
  /**
   * Overrides the glyph's own size, independent of `size` (which still
   * controls the button's clickable box). Omit for the default behavior —
   * a deliberately smaller glyph inside a larger tap target (e.g. `md`'s
   * own icon renders at `xs`), the right choice for a standalone dismiss
   * control where touch-target size matters more than matching a nearby
   * icon exactly. Set this when `CloseButton` sits inline alongside other
   * icons that must match its glyph size precisely (e.g. `Tag`'s
   * removable affordance, sized off the same scale its own leading/
   * trailing icons use) — without it, the mismatch reads as the glyph
   * being off-size and slightly misaligned, not just smaller.
   */
  iconSize?: IconSize;
}
