import type { SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type AffixSide = "top" | "bottom";

export interface AffixProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Which edge to stick to.
   * @default 'top'
   */
  side?: AffixSide;
  /**
   * Distance from that edge before it sticks, from the spacing token scale.
   * @default 0
   */
  offset?: SpaceValue;
  /**
   * Called whenever the stuck state changes. Also reflected on the
   * rendered element as `data-stuck`, so purely presentational reactions
   * (e.g. a shadow once stuck) can be done in CSS without this callback.
   */
  onStickyChange?: (stuck: boolean) => void;
  children: ReactNode;
}
