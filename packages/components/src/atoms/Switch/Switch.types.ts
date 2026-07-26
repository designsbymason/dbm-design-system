import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type SwitchSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SwitchProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "checked" | "defaultChecked" | "onChange"
  > {
  /** @default 'md' */
  size?: SwitchSize;
  /** The controlled checked state. */
  checked?: boolean;
  /** The initial checked state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the new checked state whenever it changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Icon shown inside the thumb while the switch is on. */
  checkedIcon?: PhosphorIcon;
  /** Icon shown inside the thumb while the switch is off. */
  uncheckedIcon?: PhosphorIcon;
  /**
   * Inline label rendered next to the switch. When omitted, provide an
   * `aria-label` instead (matches `IconButton`'s icon-only convention).
   */
  children?: ReactNode;
}
