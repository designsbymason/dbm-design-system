import type { Icon as PhosphorIcon, IconWeight } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef } from "react";

/** Icon size step, matching the primitive icon-size token scale. */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface IconProps extends Omit<ComponentPropsWithoutRef<"svg">, "color"> {
  /**
   * The Phosphor icon component to render — a component reference, not a
   * string name, so unused icons stay tree-shaken and references are
   * type-checked.
   * @example
   * ```tsx
   * import { Wallet } from '@dbm-design-system/icons';
   * <Icon icon={Wallet} />
   * ```
   */
  icon: PhosphorIcon;
  /**
   * @default 'md'
   */
  size?: IconSize;
  /**
   * @default 'regular'
   */
  weight?: IconWeight;
  /**
   * Accessible label. When omitted, the icon is treated as decorative and
   * hidden from the accessibility tree — set this whenever the icon
   * conveys meaning not already provided by adjacent text.
   */
  label?: string;
}
