import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Controls when the underline is visible. `always` (the default) is the
 * safe choice for links inline within body text — WCAG 1.4.1 requires links
 * to be distinguishable from surrounding text by more than color alone
 * unless the color contrast between them is at least 3:1, which none of
 * this system's theme pairings clear (checked directly: 1.92–2.33:1 across
 * all four themes). `hover` (the previous default) only reveals the
 * underline on `:hover`, which never fires for keyboard/touch users — use
 * it only where there's no surrounding flowing text to confuse the link
 * with (e.g. a future Navbar's nav links), where `none` is often more
 * appropriate anyway.
 */
export type LinkUnderline = "always" | "hover" | "none";

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  /** The link destination. */
  href: string;
  /**
   * Applies external-link affordances: opens in a new tab
   * (`target="_blank"`), sets `rel="noopener noreferrer"`, appends a small
   * external-link icon, and adds a visually-hidden "(opens in a new tab)"
   * cue for screen reader users. Auto-detected from `href` (any absolute
   * `http(s)://` or protocol-relative `//` URL) when not set explicitly.
   */
  external?: boolean;
  /**
   * Controls when the underline is visible.
   * @default 'always'
   */
  underline?: LinkUnderline;
  /**
   * Merge props onto the single child element instead of rendering an
   * `<a>` (via Radix `Slot`). The external-link icon and the visually-hidden
   * "(opens in a new tab)" cue are not rendered in this mode, since `Slot`
   * requires exactly one child — the consumer's own child element is
   * responsible for its own accessible content in that case.
   * @default false
   */
  asChild?: boolean;
  /** The link text/content. */
  children?: ReactNode;
}
