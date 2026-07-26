import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button.types";

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "aria-label"
> {
  /** The icon to render — a component reference, not a string name. */
  icon: PhosphorIcon;
  /** @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  /**
   * Shows a spinner in place of the icon and disables interaction while
   * `true`. When `asChild` is also set, the slotted element can't take a
   * native `disabled` attribute, so this instead applies `aria-disabled`
   * plus matching dimmed styling and blocks its click handler.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Overrides `aria-label` while `isLoading` is `true` (e.g. "Deleting…")
   * — there's no visible text to swap the way `Button`'s `loadingText`
   * does, and `aria-busy` alone isn't reliably announced by every screen
   * reader. Falls back to `aria-label` when omitted.
   */
  loadingLabel?: string;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`).
   * @default false
   */
  asChild?: boolean;
  /**
   * Renders as a circle instead of the standard rounded-corner shape —
   * common for floating-action-button-style triggers.
   * @default false
   */
  rounded?: boolean;
  /**
   * Required — an icon-only button has no visible text, so an accessible
   * name must be supplied explicitly.
   */
  "aria-label": string;
}
