import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Highlight.module.css";
import type { HighlightProps, HighlightTone } from "./Highlight.types";

const toneClass: Record<HighlightTone, string | undefined> = {
  warning: styles.toneWarning,
  success: styles.toneSuccess,
  info: styles.toneInfo,
  danger: styles.toneDanger,
};

/**
 * An inline highlight for emphasizing a substring — search-match
 * highlighting, "new" markers, etc. Renders a native `<mark>` (semantically
 * "content of special relevance"), styled with a token-driven
 * background/text pairing rather than the browser's default yellow.
 * Wrapping the matched substring itself (e.g. from a search query) is the
 * caller's responsibility — this is the styled span, not a text-matching
 * utility.
 *
 * @example
 * ```tsx
 * <Text>Results for <Highlight>{query}</Highlight></Text>
 * <Highlight tone="danger">Deprecated</Highlight>
 * ```
 */
export const Highlight = forwardRef<HTMLElement, HighlightProps>(
  ({ tone = "warning", className, ...props }, ref) => (
    <mark
      ref={ref}
      className={cx(styles.root, toneClass[tone], className)}
      {...props}
    />
  ),
);

Highlight.displayName = "Highlight";
