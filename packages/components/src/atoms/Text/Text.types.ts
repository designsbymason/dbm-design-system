import type { ComponentPropsWithoutRef } from "react";

/**
 * Font-size step, matching the primitive font-size token scale. Wider than
 * the standard `xs | sm | md | lg | xl` component size scale since typography
 * needs its own finer-grained steps (including `base`, and up to `6xl` for
 * display text) — this still traces to one canonical token category rather
 * than inventing a separate scale.
 */
export type TextSize =
  | "xs"
  | "sm"
  | "base"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

export type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "disabled"
  | "link"
  | "danger"
  | "warning"
  | "success"
  | "info";

export type TextElement = "p" | "span" | "div" | "label" | "legend";

export interface TextProps extends ComponentPropsWithoutRef<"p"> {
  /**
   * The HTML element to render as.
   * @default 'p'
   */
  as?: TextElement;
  /** @default 'base' */
  size?: TextSize;
  /** @default 'regular' */
  weight?: TextWeight;
  /** @default 'primary' */
  color?: TextColor;
}
