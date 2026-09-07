import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

// Reuses exactly Badge's already contrast-verified "subtle" tone pairings
// (bg.{tone}-subtle + text.{tone}) rather than introducing a new one —
// "neutral"/"brand" aren't included since neither has a subtle-background
// pairing verified anywhere yet, and a highlight specifically needs one.
export type HighlightTone = "warning" | "success" | "info" | "danger";

export interface HighlightProps extends ComponentPropsWithoutRef<"mark"> {
  /**
   * The content to highlight. When `query` is omitted, this can be any
   * ReactNode and is rendered as one highlighted `<mark>` in full — the
   * caller pre-wraps the matched substring itself (e.g. a search-result
   * snippet already split around the matched term). When `query` is
   * provided, this must be a plain string — Highlight finds and wraps each
   * match itself instead.
   */
  children: ReactNode;
  /**
   * Semantic tone controlling the background/text color pairing.
   * @default 'warning'
   */
  tone?: HighlightTone;
  /**
   * A substring (or array of substrings) to automatically find and wrap
   * within `children`, instead of highlighting all of it. Requires
   * `children` to be a plain string — in development, passing a non-string
   * `children` alongside `query` logs a warning and falls back to
   * highlighting the whole of `children`. Matching is case-insensitive by
   * default (see `caseSensitive`). A `query` with no match in `children`
   * renders no `<mark>` at all — only actual matches get highlighted.
   */
  query?: string | string[];
  /**
   * Whether `query` matching is case-sensitive. Only relevant when `query`
   * is provided.
   * @default false
   */
  caseSensitive?: boolean;
  /**
   * Standard DOM id. Attached to a single generated `<mark>` when `query`
   * produces exactly one match (or when `query` is omitted, the usual
   * single-`<mark>` case) — avoid pairing `id`/`data-testid` with a `query`
   * that can match more than once, since they'd otherwise be duplicated
   * across every match.
   */
  id?: string;
  /** Additional CSS classes, applied to every generated `<mark>`. */
  className?: string;
  /** Inline styles, applied to every generated `<mark>`. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect. See the
   * `id` prop's own note on duplicate-across-matches behavior with `query`.
   */
  "data-testid"?: string;
}
