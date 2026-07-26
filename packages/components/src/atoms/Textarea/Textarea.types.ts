import type { ComponentPropsWithoutRef } from "react";

export type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";

export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "size"> {
  /**
   * Marks the textarea as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /** @default 'md' */
  size?: TextareaSize;
  /**
   * Grows the textarea's height to fit its content as the user types,
   * instead of scrolling internally. Disables manual resizing (the
   * `resize` prop is ignored) while enabled, since the two behaviors
   * conflict.
   * @default false
   */
  autoResize?: boolean;
  /**
   * Which direction, if any, the user can manually resize the textarea by
   * dragging its corner handle. Ignored when `autoResize` is `true`.
   * @default 'vertical'
   */
  resize?: TextareaResize;
  /**
   * Shows a live `current/max` character count below the textarea. Only
   * renders when `maxLength` is also set.
   * @default false
   */
  showCount?: boolean;
}
