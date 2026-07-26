import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { TextColor, TextFontFamily, TextWeight } from "../Text/Text.types";

/** Semantic heading level, rendered as the matching `h1`-`h6` element by default. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Visual size, independent of `level` — document structure (`level`) and
 * visual hierarchy (`size`) don't always have to match 1:1.
 */
export type HeadingSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

export type HeadingProps<E extends ElementType = "h1"> = {
  /**
   * Semantic heading level, rendered as `h1`-`h6` by default. When `as` is
   * set to a non-heading element, this instead drives `aria-level` on a
   * `role="heading"` fallback, so the element still surfaces as a heading
   * of the correct level to assistive technology.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * Visual size. Defaults to a sensible size for the given `level`, but can
   * be set independently.
   */
  size?: HeadingSize;
  /**
   * Font weight.
   * @default 'bold'
   */
  weight?: TextWeight;
  /**
   * Semantic text color.
   * @default 'primary'
   */
  color?: TextColor;
  /**
   * Font family. `primary` switches to Nunito, for UI-dense/enterprise
   * sections that want headings to stay consistent with the rest of the
   * interface rather than the editorial serif.
   * @default 'secondary'
   */
  fontFamily?: TextFontFamily;
  /**
   * Truncates text after this many lines, with an ellipsis
   * (`-webkit-line-clamp`, supported by all evergreen browsers).
   */
  truncate?: number;
  /**
   * The HTML element (or component) to render as, overriding the element
   * `level` would normally select. Renders `role="heading"` and
   * `aria-level={level}` in this case, so the element is still discoverable
   * as a heading of the correct level to assistive technology — use this to
   * decouple visual heading styling from document structure (e.g. a
   * repeated card title that shouldn't add another entry to the page's
   * heading outline), not to opt out of heading semantics altogether.
   */
  as?: E;
  /** The heading text. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
