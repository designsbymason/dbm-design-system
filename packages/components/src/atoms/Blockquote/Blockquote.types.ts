import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface BlockquoteProps extends ComponentPropsWithoutRef<"blockquote"> {
  /**
   * Attribution rendered below the quote in a `<footer><cite>` (e.g. "Jane
   * Doe, CEO of Acme"), the semantic HTML pattern for quote attribution.
   */
  attribution?: ReactNode;
  children: ReactNode;
}
