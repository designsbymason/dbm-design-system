import type { ComponentPropsWithoutRef } from "react";

export type CloseButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface CloseButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** @default 'md' */
  size?: CloseButtonSize;
}
