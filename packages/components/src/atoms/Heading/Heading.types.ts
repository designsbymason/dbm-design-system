import type { ComponentPropsWithoutRef } from "react";
import type { TextColor, TextWeight } from "../Text/Text.types";

/** Semantic heading level, rendered as the matching `h1`-`h6` element. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Visual size, independent of `level` — document structure (`level`) and
 * visual hierarchy (`size`) don't always have to match 1:1.
 */
export type HeadingSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

export interface HeadingProps extends ComponentPropsWithoutRef<"h1"> {
  /**
   * Semantic heading level, rendered as `h1`-`h6`.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * Visual size. Defaults to a sensible size for the given `level`, but can
   * be set independently.
   */
  size?: HeadingSize;
  /** @default 'bold' */
  weight?: TextWeight;
  /** @default 'primary' */
  color?: TextColor;
}
