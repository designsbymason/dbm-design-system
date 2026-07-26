import type { SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type BleedSide = "inline" | "block" | "all";

export interface BleedProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * How far to bleed — matching the parent's own padding you're
   * counteracting (e.g. a `Container` padded with `space-6` needs
   * `inset={6}` to bleed its content back out to the viewport edge).
   * No default: an arbitrary value would silently bleed the wrong amount
   * for whatever padding is actually on the parent.
   */
  inset: SpaceValue;
  /**
   * Which axis to bleed on.
   * @default 'inline'
   */
  side?: BleedSide;
  children: ReactNode;
}
