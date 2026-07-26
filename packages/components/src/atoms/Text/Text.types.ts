import type { ComponentPropsWithoutRef, ReactNode } from "react";

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

/**
 * `primary` is Nunito (UI text); `secondary` is Lora, the token system's
 * editorial/display family — meant for longer-form reading content, which
 * is exactly what body copy set with `Text` often is.
 */
export type TextFontFamily = "primary" | "secondary";

export type TextElement = "p" | "span" | "div" | "label" | "legend";

export type TextProps<E extends TextElement = "p"> = {
  /**
   * The HTML element to render as.
   * @default 'p'
   */
  as?: E;
  /**
   * Font size, from the full font-size token scale.
   * @default 'base'
   */
  size?: TextSize;
  /**
   * Font weight.
   * @default 'regular'
   */
  weight?: TextWeight;
  /**
   * Semantic text color.
   * @default 'primary'
   */
  color?: TextColor;
  /**
   * Font family. `secondary` switches to Lora for editorial/long-form
   * reading content.
   * @default 'primary'
   */
  fontFamily?: TextFontFamily;
  /**
   * Truncates text after this many lines, with an ellipsis
   * (`-webkit-line-clamp`, supported by all evergreen browsers).
   */
  truncate?: number;
  /** The text content. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
