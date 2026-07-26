import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. */
export type TagTone = "neutral" | "info" | "success" | "warning" | "danger";
export type TagVariant = "subtle" | "solid";
export type TagSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TagProps extends ComponentPropsWithoutRef<"span"> {
  /** @default 'neutral' */
  tone?: TagTone;
  /** @default 'subtle' */
  variant?: TagVariant;
  /** @default 'md' */
  size?: TagSize;
  /** Leading icon — a component reference, not a string name. */
  icon?: PhosphorIcon;
  /**
   * Shows a trailing remove ("×") button, calling `onRemove` when clicked.
   * Actually removing the tag (e.g. from a filter list) is the caller's
   * responsibility.
   * @default false
   */
  removable?: boolean;
  onRemove?: () => void;
  /**
   * Accessible label for the remove button.
   * @default `Remove ${children}`
   */
  removeLabel?: string;
  children?: ReactNode;
}
