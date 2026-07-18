import type { ComponentPropsWithoutRef } from "react";

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  href: string;
  /**
   * Applies external-link affordances: opens in a new tab
   * (`target="_blank"`), sets `rel="noopener noreferrer"`, and appends a
   * small external-link icon. Auto-detected from `href` (any absolute
   * `http(s)://` or protocol-relative `//` URL) when not set explicitly.
   */
  external?: boolean;
  /**
   * Merge props onto the single child element instead of rendering an
   * `<a>` (via Radix `Slot`). The external-link icon is not rendered in
   * this mode, since `Slot` requires exactly one child.
   * @default false
   */
  asChild?: boolean;
}
