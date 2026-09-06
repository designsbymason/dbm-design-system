import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";
import type { TextColor, TextFontFamily, TextSize, TextWeight } from "../Text/Text.types";

/** Semantic heading level, rendered as the matching `h1`-`h6` element by default. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Visual size, independent of `level` — document structure (`level`) and
 * visual hierarchy (`size`) don't always have to match 1:1. Aliases `Text`'s
 * own size scale directly (rather than a separately-declared duplicate
 * union) since both draw from the same full 11-step font-size token scale —
 * the established exception for typography-driving components
 * (`05-component-api-conventions.md` §2) to the generic 5-step component
 * size scale.
 */
export type HeadingSize = TextSize;

/**
 * Text alignment, using logical (writing-direction-aware) keywords rather
 * than `left`/`right` — `start`/`end` flip correctly under RTL, per
 * `06-engineering-standards.md` §7's logical-properties convention.
 */
export type HeadingAlign = "start" | "center" | "end";

/**
 * Line-wrapping behavior, mapping to the CSS `text-wrap` property.
 * `balance` distributes text evenly across lines (avoids a short orphaned
 * last line on a multi-line heading) — a common "premium" heading
 * treatment; `pretty` avoids poor breaks (e.g. one word alone on the last
 * line) with less layout cost than `balance`. Defaults to the browser's own
 * `wrap` behavior when omitted.
 */
export type HeadingWrap = "wrap" | "nowrap" | "balance" | "pretty";

export type HeadingProps<E extends ElementType = "h1"> = {
  /** The heading text. */
  children?: ReactNode;
  /**
   * Semantic heading level, rendered as `h1`-`h6` by default. When `as` is
   * set to a non-heading element, this instead drives `aria-level` on a
   * `role="heading"` fallback, so the element still surfaces as a heading
   * of the correct level to assistive technology.
   * @default 2
   */
  level?: HeadingLevel;
  /**
   * Visual size, from the full font-size token scale. Defaults to a
   * sensible size for the given `level`, but can be set independently.
   */
  size?: HeadingSize;
  /**
   * Text alignment. Unset by default — inherits whatever alignment the
   * surrounding layout already establishes.
   */
  align?: HeadingAlign;
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
   * Line-wrapping behavior (CSS `text-wrap`). Unset by default (browser's
   * own `wrap` behavior); `balance` or `pretty` improve how a multi-line
   * heading breaks. `nowrap` conflicts with a multi-line `truncate` and
   * warns in development if combined with one.
   */
  wrap?: HeadingWrap;
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
   * Intended for a *non*-heading element — passing an actual `h1`-`h6` tag
   * here warns in development; use `level` instead to pick which heading
   * tag renders.
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
