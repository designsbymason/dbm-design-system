import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

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

/**
 * Text alignment, using logical (writing-direction-aware) keywords rather
 * than `left`/`right` — `start`/`end` flip correctly under RTL, per
 * `06-engineering-standards.md` §7's logical-properties convention. Mirrors
 * `Heading`'s own `HeadingAlign` (same value set) for API consistency
 * between the two typography atoms.
 */
export type TextAlign = "start" | "center" | "end";

/**
 * Line-wrapping behavior, mapping to the CSS `text-wrap` property.
 * `balance` distributes text evenly across lines (avoids a short orphaned
 * last line); `pretty` avoids poor breaks (e.g. one word alone on the last
 * line) with less layout cost than `balance`. Defaults to the browser's own
 * `wrap` behavior when omitted. Mirrors `Heading`'s own `HeadingWrap` (same
 * value set) for API consistency between the two typography atoms.
 */
export type TextWrap = "wrap" | "nowrap" | "balance" | "pretty";

export type TextProps<E extends TextElement = "p"> = {
  /** The text content. */
  children?: ReactNode;
  /**
   * Font size, from the full font-size token scale.
   * @default 'base'
   */
  size?: TextSize;
  /**
   * Text alignment. Unset by default — inherits whatever alignment the
   * surrounding layout already establishes.
   */
  align?: TextAlign;
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
   * Line-wrapping behavior (CSS `text-wrap`). Unset by default (browser's
   * own `wrap` behavior); `balance` or `pretty` improve how a multi-line
   * paragraph breaks. `nowrap` conflicts with a multi-line `truncate` and
   * warns in development if combined with one.
   */
  wrap?: TextWrap;
  /**
   * Truncates text after this many lines, with an ellipsis
   * (`-webkit-line-clamp`, supported by all evergreen browsers).
   */
  truncate?: number;
  /**
   * The HTML element to render as.
   * @default 'p'
   */
  as?: E;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * component, or a test/router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "children">;
