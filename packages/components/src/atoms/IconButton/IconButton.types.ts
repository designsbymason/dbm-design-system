import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button.types";

export interface IconButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "aria-label"> {
  /** The icon to render — a component reference, not a string name. */
  icon: PhosphorIcon;
  /** @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  /**
   * Shows a spinner in place of the icon and disables interaction while
   * `true`.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`).
   * @default false
   */
  asChild?: boolean;
  /**
   * Required — an icon-only button has no visible text, so an accessible
   * name must be supplied explicitly.
   */
  "aria-label": string;
}
